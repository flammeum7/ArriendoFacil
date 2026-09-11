const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../config/constants');
const { getPagination, buildMeta } = require('../../utils/pagination');

async function createNotification({
  userId,
  type,
  message,
  relatedEntity = null,
  relatedId = null,
  dedupeKey = null,
}) {
  try {
    if (dedupeKey) {
      const existing = await prisma.notification.findUnique({ where: { dedupeKey } });
      if (existing) return existing;
    }
    return await prisma.notification.create({
      data: { userId, type, message, relatedEntity, relatedId, dedupeKey },
    });
  } catch (e) {
    if (e.code === 'P2002') return null;
    console.error('[NOTIFY] No se pudo crear la notificación:', e.message);
    return null;
  }
}

async function getLandlordId() {
  const landlord = await prisma.user.findFirst({
    where: { role: ROLES.LANDLORD },
    select: { id: true },
  });
  return landlord ? landlord.id : null;
}

async function list(user, query) {
  const { page, limit, skip } = getPagination(query);

  const where = { userId: user.id };
  if (query.unread === 'true') where.read = false;

  const [total, items, unread] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return { items, meta: buildMeta(total, page, limit), unread };
}

async function unreadCount(user) {
  const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
  return { unread };
}

async function markRead(user, id) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== user.id) throw ApiError.notFound('Notificación no encontrada');
  await prisma.notification.update({ where: { id }, data: { read: true } });
  return true;
}

async function markAllRead(user) {
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return true;
}

module.exports = { createNotification, getLandlordId, list, unreadCount, markRead, markAllRead };
