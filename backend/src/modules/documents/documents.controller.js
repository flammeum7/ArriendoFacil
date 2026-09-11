const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./documents.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user, req.query);
  success(res, { message: 'Documentos', data });
});

const create = asyncHandler(async (req, res) => {
  const document = await service.createByLandlord(req.user.id, req.validated.body, req.file);
  success(res, { statusCode: 201, message: 'Documento subido', data: { document } });
});

const remove = asyncHandler(async (req, res) => {
  await service.softDelete(req.user.id, Number(req.params.id));
  success(res, { message: 'Documento eliminado' });
});

const download = asyncHandler(async (req, res) => {
  const { absolutePath, mimeType, originalName } = await service.getForDownload(
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

module.exports = { list, create, remove, download };
