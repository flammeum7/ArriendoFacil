const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const paymentsService = require('../payments/payments.service');
const reminders = require('../../jobs/reminders');

const generatePayments = asyncHandler(async (req, res) => {
  const data = await paymentsService.generateForActiveContracts();
  success(res, { message: 'Generación de pagos ejecutada', data });
});

const markOverdue = asyncHandler(async (req, res) => {
  const data = await paymentsService.markOverdue();
  success(res, { message: 'Actualización de vencidos ejecutada', data });
});

const paymentReminders = asyncHandler(async (req, res) => {
  const data = await reminders.paymentReminders();
  success(res, { message: 'Recordatorios de pago ejecutados', data });
});

const contractAlerts = asyncHandler(async (req, res) => {
  const data = await reminders.contractsExpiring();
  success(res, { message: 'Alertas de contratos por vencer ejecutadas', data });
});

module.exports = { generatePayments, markOverdue, paymentReminders, contractAlerts };
