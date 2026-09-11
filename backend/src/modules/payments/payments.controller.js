const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./payments.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user, req.query);
  success(res, { message: 'Pagos', data });
});

const getById = asyncHandler(async (req, res) => {
  const payment = await service.getById(req.user, Number(req.params.id));
  success(res, { message: 'Pago', data: { payment } });
});

const uploadReceipt = asyncHandler(async (req, res) => {
  const method = req.body ? req.body.method : undefined;
  const payment = await service.uploadReceipt(req.user, Number(req.params.id), req.file, method);
  success(res, { message: 'Comprobante cargado. El pago quedó por validar.', data: { payment } });
});

const approve = asyncHandler(async (req, res) => {
  const payment = await service.approve(req.user.id, Number(req.params.id));
  success(res, { message: 'Pago aprobado', data: { payment } });
});

const reject = asyncHandler(async (req, res) => {
  const payment = await service.reject(req.user.id, Number(req.params.id), req.body.reason);
  success(res, { message: 'Pago rechazado', data: { payment } });
});

const generate = asyncHandler(async (req, res) => {
  const result = await service.generateForActiveContracts();
  success(res, { message: 'Generación de pagos ejecutada', data: result });
});

const markOverdue = asyncHandler(async (req, res) => {
  const result = await service.markOverdue();
  success(res, { message: 'Actualización de vencidos ejecutada', data: result });
});

module.exports = { list, getById, uploadReceipt, approve, reject, generate, markOverdue };
