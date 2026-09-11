const cron = require('node-cron');
const paymentsService = require('../modules/payments/payments.service');
const reminders = require('./reminders');

const cronOpts = { timezone: 'America/Lima' };

function startScheduler() {
  // 00:10 diario — generar pagos del ciclo vigente
  cron.schedule('10 0 * * *', async () => {
    try {
      const r = await paymentsService.generateForActiveContracts();
      console.log('[CRON] Generación de pagos:', r);
    } catch (e) {
      console.error('[CRON] Error generando pagos:', e.message);
    }
  }, cronOpts);

  // 00:20 diario — marcar pagos vencidos
  cron.schedule('20 0 * * *', async () => {
    try {
      const r = await paymentsService.markOverdue();
      console.log('[CRON] Pagos vencidos:', r);
    } catch (e) {
      console.error('[CRON] Error marcando vencidos:', e.message);
    }
  }, cronOpts);

  // 08:00 diario — recordatorios de pago (3 días antes)
  cron.schedule('0 8 * * *', async () => {
    try {
      const r = await reminders.paymentReminders();
      console.log('[CRON] Recordatorios de pago:', r);
    } catch (e) {
      console.error('[CRON] Error en recordatorios:', e.message);
    }
  }, cronOpts);

  // 08:05 diario — contratos próximos a vencer
  cron.schedule('5 8 * * *', async () => {
    try {
      const r = await reminders.contractsExpiring();
      console.log('[CRON] Contratos por vencer:', r);
    } catch (e) {
      console.error('[CRON] Error en contratos por vencer:', e.message);
    }
  }, cronOpts);

  console.log('[CRON] Tareas programadas activadas (zona horaria America/Lima)');
}

module.exports = { startScheduler };
