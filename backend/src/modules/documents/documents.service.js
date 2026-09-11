const path = require('path');
const fs = require('fs');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES, NOTIFICATION_TYPE } = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');
const { UPLOAD_DIR } = require('../../middlewares/upload');
const { createNotification } = require('../notifications/notifications.service');

async function list(user, query) {
  const { page, limit, skip } = getPagination(query);

  const where = { deletedAt: null };
  if (user.role === ROLES.TENANT) {
    where.ownerId = user.id; // aislamiento: solo sus documentos
  } else {
    if (query.ownerId) where.ownerId = Number(query.ownerId);
    if (query.type) where.type = query.type;
    if (query.contractId) where.contractId = Number(query.contractId);
  }

  const [total, items] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        ownerId: true,
        contractId: true,
        paymentId: true,
        createdAt: true,
      },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function createByLandlord(actorId, data, file) {
  if (!file) throw ApiError.badRequest('Debes adjuntar el archivo');

  const owner = await prisma.user.findFirst({
    where: { id: data.ownerId, role: ROLES.TENANT },
  });
  if (!owner) throw ApiError.badRequest('El arrendatario indicado no existe');

  if (data.contractId) {
    const contract = await prisma.contract.findUnique({ where: { id: data.contractId } });
    if (!contract) throw ApiError.badRequest('El contrato indicado no existe');
    if (contract.tenantId !== data.ownerId) {
      throw ApiError.badRequest('El contrato no pertenece a ese arrendatario');
    }
  }
  if (data.paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: data.paymentId } });
    if (!payment) throw ApiError.badRequest('El pago indicado no existe');
    if (payment.tenantId !== data.ownerId) {
      throw ApiError.badRequest('El pago no pertenece a ese arrendatario');
    }
  }

  const doc = await prisma.document.create({
    data: {
      type: data.type,
      ownerId: data.ownerId,
      uploadedById: actorId,
      contractId: data.contractId || null,
      paymentId: data.paymentId || null,
      storagePath: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    },
  });

  await writeAudit({
    actorId,
    action: 'DOCUMENT_UPLOADED',
    entity: 'Document',
    entityId: doc.id,
    metadata: { type: doc.type, ownerId: doc.ownerId },
  });

  await createNotification({
    userId: doc.ownerId,
    type: NOTIFICATION_TYPE.NEW_DOCUMENT,
    message: `Tienes un nuevo documento disponible: ${doc.originalName}`,
    relatedEntity: 'Document',
    relatedId: doc.id,
  });

  return doc;
}

async function softDelete(actorId, id) {
  const doc = await prisma.document.findFirst({ where: { id, deletedAt: null } });
  if (!doc) throw ApiError.notFound('Documento no encontrado');

  // Borrado lógico: se conserva para auditoría
  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });

  await writeAudit({ actorId, action: 'DOCUMENT_DELETED', entity: 'Document', entityId: id });
  return true;
}

async function getForDownload(user, id) {
  const doc = await prisma.document.findFirst({ where: { id, deletedAt: null } });
  if (!doc) throw ApiError.notFound('Documento no encontrado');

  if (user.role !== ROLES.LANDLORD && doc.ownerId !== user.id) {
    throw ApiError.forbidden('No tienes acceso a este documento');
  }

  const absolutePath = path.join(UPLOAD_DIR, doc.storagePath);
  if (!fs.existsSync(absolutePath)) {
    throw ApiError.notFound('El archivo no existe en el servidor');
  }

  return { absolutePath, mimeType: doc.mimeType, originalName: doc.originalName };
}

module.exports = { list, createByLandlord, softDelete, getForDownload };
