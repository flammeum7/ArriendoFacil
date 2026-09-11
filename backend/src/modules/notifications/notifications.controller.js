const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./notifications.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user, req.query);
  success(res, { message: 'Notificaciones', data });
});

const unreadCount = asyncHandler(async (req, res) => {
  const data = await service.unreadCount(req.user);
  success(res, { message: 'No leídas', data });
});

const markRead = asyncHandler(async (req, res) => {
  await service.markRead(req.user, Number(req.params.id));
  success(res, { message: 'Notificación marcada como leída' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await service.markAllRead(req.user);
  success(res, { message: 'Todas marcadas como leídas' });
});

module.exports = { list, unreadCount, markRead, markAllRead };
