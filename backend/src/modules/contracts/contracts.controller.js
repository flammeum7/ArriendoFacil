const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./contracts.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.query);
  success(res, { message: 'Contratos', data });
});

const getById = asyncHandler(async (req, res) => {
  const contract = await service.getById(Number(req.params.id));
  success(res, { message: 'Contrato', data: { contract } });
});

const create = asyncHandler(async (req, res) => {
  const contract = await service.create(req.user.id, req.validated.body);
  success(res, { statusCode: 201, message: 'Contrato creado', data: { contract } });
});

const renew = asyncHandler(async (req, res) => {
  const contract = await service.renew(req.user.id, Number(req.params.id), req.validated.body);
  success(res, { statusCode: 201, message: 'Contrato renovado', data: { contract } });
});

const cancel = asyncHandler(async (req, res) => {
  await service.cancel(req.user.id, Number(req.params.id));
  success(res, { message: 'Contrato cancelado' });
});

module.exports = { list, getById, create, renew, cancel };
