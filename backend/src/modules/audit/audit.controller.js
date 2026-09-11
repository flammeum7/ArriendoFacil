const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./audit.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.query);
  success(res, { message: 'Auditoría', data });
});

module.exports = { list };
