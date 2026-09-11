const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES, CONTRACT_STATUS, PROPERTY_STATUS } = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

// Fecha-only en UTC medianoche para evitar corrimientos por zona horaria
function parseDate(str) {
  return new Date(`${str}T00:00:00.000Z`);
}

function validateDates(startDate, endDate) {
  if (endDate < startDate) {
    throw ApiError.badRequest(
      'La fecha de vencimiento no puede ser anterior a la fecha de inicio'
    );
  }
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);

  const where = {};
  if (query.status) where.status = query.status;
  if (query.propertyId) where.propertyId = Number(query.propertyId);
  if (query.tenantId) where.tenantId = Number(query.tenantId);

  const [total, items] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, fullName: true, dni: true } },
        property: { select: { id: true, address: true } },
      },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function getById(id) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, fullName: true, dni: true, email: true } },
      property: true,
      previousContract: { select: { id: true, startDate: true, endDate: true } },
      renewedInto: { select: { id: true, startDate: true, endDate: true } },
    },
  });
  if (!contract) throw ApiError.notFound('Contrato no encontrado');
  return contract;
}

async function create(actorId, data) {
  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);
  validateDates(startDate, endDate);

  const tenant = await prisma.user.findFirst({
    where: { id: data.tenantId, role: ROLES.TENANT },
  });
  if (!tenant) throw ApiError.badRequest('El arrendatario indicado no existe');
  if (!tenant.active) throw ApiError.badRequest('El arrendatario está inactivo');

  const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
  if (!property) throw ApiError.badRequest('La propiedad indicada no existe');

  const activeExisting = await prisma.contract.findFirst({
    where: { propertyId: data.propertyId, status: CONTRACT_STATUS.ACTIVE },
  });
  if (activeExisting) {
    throw ApiError.conflict('La propiedad ya tiene un contrato vigente');
  }

  try {
    const contract = await prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          tenantId: data.tenantId,
          propertyId: data.propertyId,
          startDate,
          endDate,
          rent: data.rent,
          deposit: data.deposit,
          conditions: data.conditions || null,
          dueDayOffset: data.dueDayOffset ?? 5,
          status: CONTRACT_STATUS.ACTIVE,
          activePropertyKey: data.propertyId, // llave única: garantiza 1 vigente por propiedad
        },
      });

      await tx.property.update({
        where: { id: data.propertyId },
        data: { status: PROPERTY_STATUS.OCCUPIED },
      });

      return created;
    });

    await writeAudit({
      actorId,
      action: 'CONTRACT_CREATED',
      entity: 'Contract',
      entityId: contract.id,
      metadata: { tenantId: data.tenantId, propertyId: data.propertyId },
    });

    return contract;
  } catch (e) {
    if (e.code === 'P2002') {
      throw ApiError.conflict('La propiedad ya tiene un contrato vigente');
    }
    throw e;
  }
}

async function renew(actorId, id, data) {
  const previous = await prisma.contract.findUnique({ where: { id } });
  if (!previous) throw ApiError.notFound('Contrato no encontrado');
  if (previous.status !== CONTRACT_STATUS.ACTIVE) {
    throw ApiError.conflict('Solo se puede renovar un contrato vigente');
  }

  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);
  validateDates(startDate, endDate);

  try {
    const newContract = await prisma.$transaction(async (tx) => {
      // El contrato anterior pasa a RENOVADO y libera la llave única
      await tx.contract.update({
        where: { id: previous.id },
        data: { status: CONTRACT_STATUS.RENEWED, activePropertyKey: null },
      });

      const created = await tx.contract.create({
        data: {
          tenantId: previous.tenantId,
          propertyId: previous.propertyId,
          startDate,
          endDate,
          rent: data.rent ?? previous.rent,
          deposit: data.deposit ?? previous.deposit,
          conditions: data.conditions ?? previous.conditions,
          dueDayOffset: data.dueDayOffset ?? previous.dueDayOffset,
          status: CONTRACT_STATUS.ACTIVE,
          activePropertyKey: previous.propertyId,
          previousContractId: previous.id,
        },
      });

      await tx.property.update({
        where: { id: previous.propertyId },
        data: { status: PROPERTY_STATUS.OCCUPIED },
      });

      return created;
    });

    await writeAudit({
      actorId,
      action: 'CONTRACT_RENEWED',
      entity: 'Contract',
      entityId: newContract.id,
      metadata: { previousContractId: previous.id },
    });

    return newContract;
  } catch (e) {
    if (e.code === 'P2002') {
      throw ApiError.conflict('Ya existe un contrato vigente para esta propiedad');
    }
    throw e;
  }
}

async function cancel(actorId, id) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw ApiError.notFound('Contrato no encontrado');
  if (contract.status !== CONTRACT_STATUS.ACTIVE) {
    throw ApiError.conflict('Solo se puede cancelar un contrato vigente');
  }

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id },
      data: { status: CONTRACT_STATUS.CANCELLED, activePropertyKey: null },
    });
    await tx.property.update({
      where: { id: contract.propertyId },
      data: { status: PROPERTY_STATUS.AVAILABLE },
    });
  });

  await writeAudit({
    actorId,
    action: 'CONTRACT_CANCELLED',
    entity: 'Contract',
    entityId: id,
  });
  return true;
}

module.exports = { list, getById, create, renew, cancel };
