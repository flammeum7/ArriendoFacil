const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./services.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user, req.query);
  success(res, { message: 'Servicios', data });
});

const getById = asyncHandler(async (req, res) => {
  const item = await service.getById(req.user, Number(req.params.id));
  success(res, { message: 'Servicio', data: { service: item } });
});

const create = asyncHandler(async (req, res) => {
  const item = await service.create(req.user.id, req.validated.body);
  success(res, { statusCode: 201, message: 'Servicio registrado', data: { service: item } });
});

const update = asyncHandler(async (req, res) => {
  const item = await service.update(req.user.id, Number(req.params.id), req.validated.body);
  success(res, { message: 'Servicio actualizado', data: { service: item } });
});

module.exports = { list, getById, create, update };
