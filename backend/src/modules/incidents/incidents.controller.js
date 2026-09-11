const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./incidents.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user, req.query);
  success(res, { message: 'Incidencias', data });
});

const getById = asyncHandler(async (req, res) => {
  const incident = await service.getById(req.user, Number(req.params.id));
  success(res, { message: 'Incidencia', data: { incident } });
});

const create = asyncHandler(async (req, res) => {
  const incident = await service.create(req.user, req.validated.body, req.files);
  success(res, { statusCode: 201, message: 'Incidencia registrada', data: { incident } });
});

const respond = asyncHandler(async (req, res) => {
  const { message, status } = req.validated.body;
  const response = await service.respond(req.user, Number(req.params.id), message, status, req.files);
  success(res, { statusCode: 201, message: 'Respuesta registrada', data: { response } });
});

const changeStatus = asyncHandler(async (req, res) => {
  const incident = await service.changeStatus(req.user.id, Number(req.params.id), req.validated.body.status);
  success(res, { message: 'Estado actualizado', data: { incident } });
});

const downloadAttachment = asyncHandler(async (req, res) => {
  const { absolutePath, mimeType, originalName } = await service.getAttachmentForDownload(
    req.user,
    Number(req.params.id)
  );
  res.setHeader('Content-Type', mimeType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(originalName)}"`
  );
  res.sendFile(absolutePath);
});

module.exports = { list, getById, create, respond, changeStatus, downloadAttachment };
