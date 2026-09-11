const prisma = require('../../config/prisma');
const { getPagination, buildMeta } = require('../../utils/pagination');

async function list(query) {
  const { page, limit, skip } = getPagination(query);

  const where = {};
  if (query.entity) where.entity = query.entity;
  if (query.action) where.action = query.action;
  if (query.actorId) where.actorId = Number(query.actorId);
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, fullName: true, role: true } } },
    }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

module.exports = { list };
