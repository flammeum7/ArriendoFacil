const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { PROPERTY_STATUS, CONTRACT_STATUS } = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const search = (query.search || '').trim();

  const where = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (search) where.address = { contains: search };

  const [total, items] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function getById(id) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      contracts: {
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { id: true, fullName: true } } },
      },
    },
  });
  if (!property) throw ApiError.notFound('Propiedad no encontrada');
  return property;
}

async function create(actorId, ownerId, data) {
  const property = await prisma.property.create({
    data: {
      address: data.address,
      type: data.type,
      unitNumber: data.unitNumber || null,
      description: data.description || null,
      rooms: data.rooms ?? 0,
      referenceRent: data.referenceRent,
      ownerId,
      status: PROPERTY_STATUS.AVAILABLE,
    },
  });
  await writeAudit({ actorId, action: 'PROPERTY_CREATED', entity: 'Property', entityId: property.id });
  return property;
}

async function update(actorId, id, data) {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Propiedad no encontrada');

  const property = await prisma.property.update({
    where: { id },
    data: {
      address: data.address ?? existing.address,
      type: data.type ?? existing.type,
      unitNumber: data.unitNumber ?? existing.unitNumber,
      description: data.description ?? existing.description,
      rooms: data.rooms ?? existing.rooms,
      referenceRent: data.referenceRent ?? existing.referenceRent,
    },
  });
  await writeAudit({
    actorId,
    action: 'PROPERTY_UPDATED',
    entity: 'Property',
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });
  return property;
}

async function changeStatus(actorId, id, status) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: { contracts: { where: { status: CONTRACT_STATUS.ACTIVE } } },
  });
  if (!property) throw ApiError.notFound('Propiedad no encontrada');

  const hasActiveContract = property.contracts.length > 0;

  if (status === PROPERTY_STATUS.MAINTENANCE && hasActiveContract) {
    throw ApiError.conflict(
      'No se puede poner en mantenimiento una propiedad con un contrato vigente'
    );
  }
  if (hasActiveContract && status !== PROPERTY_STATUS.OCCUPIED) {
    throw ApiError.conflict(
      'La propiedad tiene un contrato vigente y debe permanecer como Ocupada'
    );
  }

  const updated = await prisma.property.update({ where: { id }, data: { status } });
  await writeAudit({
    actorId,
    action: 'PROPERTY_STATUS_CHANGED',
    entity: 'Property',
    entityId: id,
    metadata: { from: property.status, to: status },
  });
  return updated;
}

module.exports = { list, getById, create, update, changeStatus };
