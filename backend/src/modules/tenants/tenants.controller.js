const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./tenants.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.query);
  success(res, { message: 'Arrendatarios', data });
});

const getById = asyncHandler(async (req, res) => {
  const tenant = await service.getById(Number(req.params.id));
  success(res, { message: 'Arrendatario', data: { tenant } });
});

const create = asyncHandler(async (req, res) => {
  const tenant = await service.create(req.user.id, req.validated.body);
  success(res, {
    statusCode: 201,
    message: 'Arrendatario registrado. Se envió una contraseña temporal.',
    data: { tenant },
  });
});

const update = asyncHandler(async (req, res) => {
  const tenant = await service.update(req.user.id, Number(req.params.id), req.validated.body);
  success(res, { message: 'Arrendatario actualizado', data: { tenant } });
});

const deactivate = asyncHandler(async (req, res) => {
  await service.deactivate(req.user.id, Number(req.params.id));
  success(res, { message: 'Arrendatario desactivado' });
});

module.exports = { list, getById, create, update, deactivate };
