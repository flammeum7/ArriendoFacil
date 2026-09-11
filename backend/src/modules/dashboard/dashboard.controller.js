const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./dashboard.service');

const landlord = asyncHandler(async (req, res) => {
  const data = await service.landlord();
  success(res, { message: 'Resumen del arrendador', data });
});

const tenant = asyncHandler(async (req, res) => {
  const data = await service.tenant(req.user.id);
  success(res, { message: 'Resumen del arrendatario', data });
});

module.exports = { landlord, tenant };
