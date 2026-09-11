const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES, SERVICE_TYPE } = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');

const DEFAULT_UNIT = {
  [SERVICE_TYPE.WATER]: 'm³',
  [SERVICE_TYPE.ELECTRICITY]: 'kWh',
  [SERVICE_TYPE.INTERNET]: 'Plan fijo',
};

async function list(user, query) {
  const { page, limit, skip } = getPagination(query);

  const where = {};
  if (user.role === ROLES.TENANT) where.tenantId = user.id;
  else if (query.tenantId) where.tenantId = Number(query.tenantId);
  if (query.type) where.type = query.type;
  if (query.period) where.period = query.period;

  const [total, items] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: { tenant: { select: { id: true, fullName: true } } },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function getById(user, id) {
  const service = await prisma.service.findUnique({
    where: { id },
    include: { tenant: { select: { id: true, fullName: true } } },
  });
  if (!service) throw ApiError.notFound('Servicio no encontrado');
  if (user.role === ROLES.TENANT && service.tenantId !== user.id) {
    throw ApiError.forbidden('No tienes acceso a este servicio');
  }
  return service;
}

async function create(actorId, data) {
  const tenant = await prisma.user.findFirst({
    where: { id: data.tenantId, role: ROLES.TENANT },
  });
  if (!tenant) throw ApiError.badRequest('El arrendatario indicado no existe');

  const service = await prisma.service.create({
    data: {
      tenantId: data.tenantId,
      type: data.type,
      period: data.period,
      consumption: data.consumption ?? null,
      unit: data.unit || DEFAULT_UNIT[data.type],
      amount: data.amount,
      observations: data.observations || null,
    },
  });

  await writeAudit({ actorId, action: 'SERVICE_CREATED', entity: 'Service', entityId: service.id });
  return service;
}

async function update(actorId, id, data) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Servicio no encontrado');

  const service = await prisma.service.update({
    where: { id },
    data: {
      period: data.period ?? existing.period,
      consumption: data.consumption ?? existing.consumption,
      unit: data.unit ?? existing.unit,
      amount: data.amount ?? existing.amount,
      observations: data.observations ?? existing.observations,
    },
  });

  await writeAudit({ actorId, action: 'SERVICE_UPDATED', entity: 'Service', entityId: id });
  return service;
}

module.exports = { list, getById, create, update };
