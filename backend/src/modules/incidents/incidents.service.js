const path = require('path');
const fs = require('fs');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const {
  ROLES,
  INCIDENT_STATUS,
  INCIDENT_PRIORITY,
  NOTIFICATION_TYPE,
} = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');
const { UPLOAD_DIR } = require('../../middlewares/upload');
const { createNotification, getLandlordId } = require('../notifications/notifications.service');

function mapAttachmentData(files) {
  return (files || []).map((f) => ({
    storagePath: f.filename,
    originalName: f.originalname,
    mimeType: f.mimetype,
    sizeBytes: f.size,
  }));
}

async function list(user, query) {
  const { page, limit, skip } = getPagination(query);

  const where = {};
  if (user.role === ROLES.TENANT) where.tenantId = user.id;
  else if (query.tenantId) where.tenantId = Number(query.tenantId);
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.type) where.type = query.type;

  const [total, items] = await Promise.all([
    prisma.incident.count({ where }),
    prisma.incident.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, fullName: true } },
        _count: { select: { responses: true } },
      },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function getById(user, id) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, fullName: true } },
      attachments: true,
      responses: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, fullName: true, role: true } },
          attachments: true,
        },
      },
    },
  });
  if (!incident) throw ApiError.notFound('Incidencia no encontrada');

  if (user.role === ROLES.TENANT && incident.tenantId !== user.id) {
    throw ApiError.forbidden('No tienes acceso a esta incidencia');
  }
  return incident;
}

async function create(user, data, files) {
  const incident = await prisma.incident.create({
    data: {
      tenantId: user.id,
      type: data.type,
      title: data.title,
      description: data.description,
      priority: data.priority || INCIDENT_PRIORITY.MEDIUM,
      status: INCIDENT_STATUS.OPEN,
      attachments: { create: mapAttachmentData(files) },
    },
    include: { attachments: true },
  });

  await writeAudit({
    actorId: user.id,
    action: 'INCIDENT_CREATED',
    entity: 'Incident',
    entityId: incident.id,
  });

  const landlordId = await getLandlordId();
  if (landlordId) {
    await createNotification({
      userId: landlordId,
      type: NOTIFICATION_TYPE.NEW_INCIDENT,
      message: `Nueva incidencia: "${incident.title}"`,
      relatedEntity: 'Incident',
      relatedId: incident.id,
    });
  }

  return incident;
}

async function respond(user, id, message, status, files) {
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw ApiError.notFound('Incidencia no encontrada');

  if (user.role === ROLES.TENANT && incident.tenantId !== user.id) {
    throw ApiError.forbidden('No puedes responder una incidencia ajena');
  }
  if (incident.status === INCIDENT_STATUS.CLOSED) {
    throw ApiError.conflict('La incidencia está cerrada');
  }

  const response = await prisma.$transaction(async (tx) => {
    const created = await tx.incidentResponse.create({
      data: {
        incidentId: id,
        authorId: user.id,
        message,
        attachments: { create: mapAttachmentData(files) },
      },
      include: {
        attachments: true,
        author: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (user.role === ROLES.LANDLORD) {
      if (status && status !== incident.status) {
        await tx.incident.update({ where: { id }, data: { status } });
      } else if (incident.status === INCIDENT_STATUS.OPEN) {
        await tx.incident.update({
          where: { id },
          data: { status: INCIDENT_STATUS.IN_PROGRESS },
        });
      }
    }

    return created;
  });

  await writeAudit({
    actorId: user.id,
    action: 'INCIDENT_RESPONDED',
    entity: 'Incident',
    entityId: id,
  });

  // Notificar a la otra parte del hilo
  if (user.role === ROLES.LANDLORD) {
    await createNotification({
      userId: incident.tenantId,
      type: NOTIFICATION_TYPE.INCIDENT_RESPONSE,
      message: `El administrador respondió tu incidencia "${incident.title}"`,
      relatedEntity: 'Incident',
      relatedId: id,
    });
  } else {
    const landlordId = await getLandlordId();
    if (landlordId) {
      await createNotification({
        userId: landlordId,
        type: NOTIFICATION_TYPE.INCIDENT_RESPONSE,
        message: `El arrendatario respondió en la incidencia "${incident.title}"`,
        relatedEntity: 'Incident',
        relatedId: id,
      });
    }
  }

  return response;
}

async function changeStatus(actorId, id, status) {
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw ApiError.notFound('Incidencia no encontrada');

  const updated = await prisma.incident.update({ where: { id }, data: { status } });

  await writeAudit({
    actorId,
    action: 'INCIDENT_STATUS_CHANGED',
    entity: 'Incident',
    entityId: id,
    metadata: { from: incident.status, to: status },
  });
  return updated;
}

async function getAttachmentForDownload(user, attachmentId) {
  const att = await prisma.incidentAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      incident: true,
      response: { include: { incident: true } },
    },
  });
  if (!att) throw ApiError.notFound('Adjunto no encontrado');

  const incident = att.incident || (att.response && att.response.incident);
  if (!incident) throw ApiError.notFound('Adjunto sin incidencia asociada');

  if (user.role === ROLES.TENANT && incident.tenantId !== user.id) {
    throw ApiError.forbidden('No tienes acceso a este adjunto');
  }

  const absolutePath = path.join(UPLOAD_DIR, att.storagePath);
  if (!fs.existsSync(absolutePath)) throw ApiError.notFound('El archivo no existe en el servidor');

  return { absolutePath, mimeType: att.mimeType, originalName: att.originalName };
}

module.exports = { list, getById, create, respond, changeStatus, getAttachmentForDownload };
