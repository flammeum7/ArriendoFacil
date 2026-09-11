const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./properties.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.query);
  success(res, { message: 'Propiedades', data });
});

const getById = asyncHandler(async (req, res) => {
  const property = await service.getById(Number(req.params.id));
  success(res, { message: 'Propiedad', data: { property } });
});

const create = asyncHandler(async (req, res) => {
  // El único arrendador es el dueño de todas las propiedades
  const property = await service.create(req.user.id, req.user.id, req.validated.body);
  success(res, { statusCode: 201, message: 'Propiedad registrada', data: { property } });
});

const update = asyncHandler(async (req, res) => {
  const property = await service.update(req.user.id, Number(req.params.id), req.validated.body);
  success(res, { message: 'Propiedad actualizada', data: { property } });
});

const changeStatus = asyncHandler(async (req, res) => {
  const property = await service.changeStatus(
    req.user.id,
    Number(req.params.id),
    req.validated.body.status
  );
  success(res, { message: 'Estado actualizado', data: { property } });
});

module.exports = { list, getById, create, update, changeStatus };
