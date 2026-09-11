const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const {
  ROLES,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  CONTRACT_STATUS,
  DOCUMENT_TYPE,
  NOTIFICATION_TYPE,
} = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');
const { getCycle, getCurrentCycleIndex } = require('../../utils/billingCycle');
const { createNotification, getLandlordId } = require('../notifications/notifications.service');

async function list(user, query) {
  const { page, limit, skip } = getPagination(query);

  const where = {};
  if (user.role === ROLES.TENANT) {
    where.tenantId = user.id;
  } else if (query.tenantId) {
    where.tenantId = Number(query.tenantId);
  }
  if (query.status) where.status = query.status;
  if (query.contractId) where.contractId = Number(query.contractId);

  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { periodStart: 'desc' },
      include: {
        contract: { select: { id: true, propertyId: true } },
        documents: {
          where: { deletedAt: null },
          select: { id: true, originalName: true, createdAt: true },
        },
      },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function getById(user, id) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      contract: { select: { id: true, propertyId: true } },
      documents: { where: { deletedAt: null } },
      tenant: { select: { id: true, fullName: true } },
    },
  });
  if (!payment) throw ApiError.notFound('Pago no encontrado');

  if (user.role === ROLES.TENANT && payment.tenantId !== user.id) {
    throw ApiError.forbidden('No tienes acceso a este pago');
  }
  return payment;
}

async function uploadReceipt(user, id, file, method) {
  if (!file) throw ApiError.badRequest('Debes adjuntar el comprobante');

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw ApiError.notFound('Pago no encontrado');
  if (payment.tenantId !== user.id) {
    throw ApiError.forbidden('No puedes cargar comprobantes de otro arrendatario');
  }

  const allowed = [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.OVERDUE, PAYMENT_STATUS.REJECTED];
  if (!allowed.includes(payment.status)) {
    throw ApiError.conflict('Este pago no admite carga de comprobante en su estado actual');
  }
  if (method && !Object.values(PAYMENT_METHOD).includes(method)) {
    throw ApiError.badRequest('Método de pago inválido');
  }

  const result = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        type: DOCUMENT_TYPE.PAYMENT_RECEIPT,
        ownerId: user.id,
        uploadedById: user.id,
        paymentId: payment.id,
        storagePath: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.UNDER_REVIEW,
        method: method || payment.method,
        rejectionReason: null,
      },
    });
    return { updated, doc };
  });

  await writeAudit({
    actorId: user.id,
    action: 'PAYMENT_RECEIPT_UPLOADED',
    entity: 'Payment',
    entityId: payment.id,
    metadata: { documentId: result.doc.id },
  });

  // Notificar al arrendador que hay un comprobante por validar
  const landlordId = await getLandlordId();
  if (landlordId) {
    await createNotification({
      userId: landlordId,
      type: NOTIFICATION_TYPE.RECEIPT_UPLOADED,
      message: `Se cargó un comprobante para el pago #${payment.id}`,
      relatedEntity: 'Payment',
      relatedId: payment.id,
    });
  }

  return result.updated;
}

async function approve(actorId, id) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw ApiError.notFound('Pago no encontrado');
  if (payment.status !== PAYMENT_STATUS.UNDER_REVIEW) {
    throw ApiError.conflict('Solo se puede aprobar un pago que está por validar');
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: PAYMENT_STATUS.PAID, paymentDate: new Date(), rejectionReason: null },
  });

  await writeAudit({ actorId, action: 'PAYMENT_APPROVED', entity: 'Payment', entityId: id });

  await createNotification({
    userId: payment.tenantId,
    type: NOTIFICATION_TYPE.RECEIPT_APPROVED,
    message: `Tu comprobante del pago #${id} fue aprobado`,
    relatedEntity: 'Payment',
    relatedId: id,
  });

  return updated;
}

async function reject(actorId, id, reason) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw ApiError.notFound('Pago no encontrado');
  if (payment.status !== PAYMENT_STATUS.UNDER_REVIEW) {
    throw ApiError.conflict('Solo se puede rechazar un pago que está por validar');
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: PAYMENT_STATUS.REJECTED, rejectionReason: reason },
  });

  await writeAudit({
    actorId,
    action: 'PAYMENT_REJECTED',
    entity: 'Payment',
    entityId: id,
    metadata: { reason },
  });

  await createNotification({
    userId: payment.tenantId,
    type: NOTIFICATION_TYPE.RECEIPT_REJECTED,
    message: `Tu comprobante del pago #${id} fue rechazado. Motivo: ${reason}`,
    relatedEntity: 'Payment',
    relatedId: id,
  });

  return updated;
}

// Genera el pago del ciclo vigente para cada contrato activo (idempotente).
async function generateForActiveContracts() {
  const contracts = await prisma.contract.findMany({
    where: { status: CONTRACT_STATUS.ACTIVE },
  });
  const now = new Date();
  const result = { created: 0, skipped: 0 };

  for (const c of contracts) {
    const idx = getCurrentCycleIndex(c.startDate, now);
    if (idx < 0) continue;

    const cycle = getCycle(c.startDate, idx, c.dueDayOffset);
    if (cycle.periodStart > c.endDate) continue; // el contrato ya venció

    const exists = await prisma.payment.findUnique({
      where: {
        contractId_periodStart: { contractId: c.id, periodStart: cycle.periodStart },
      },
    });
    if (exists) {
      result.skipped += 1;
      continue;
    }

    await prisma.payment.create({
      data: {
        contractId: c.id,
        tenantId: c.tenantId,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        dueDate: cycle.dueDate,
        amount: c.rent,
        status: PAYMENT_STATUS.PENDING,
      },
    });
    result.created += 1;
  }
  return result;
}

// Marca como vencidos los pagos pendientes cuya fecha de vencimiento ya pasó.
async function markOverdue() {
  const now = new Date();
  const res = await prisma.payment.updateMany({
    where: { status: PAYMENT_STATUS.PENDING, dueDate: { lte: now } },
    data: { status: PAYMENT_STATUS.OVERDUE },
  });
  return { updated: res.count };
}

module.exports = {
  list,
  getById,
  uploadReceipt,
  approve,
  reject,
  generateForActiveContracts,
  markOverdue,
};
