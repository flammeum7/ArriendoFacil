const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const prisma = require('../config/prisma');
const { PAYMENT_STATUS, CONTRACT_STATUS, NOTIFICATION_TYPE } = require('../config/constants');
const { createNotification, getLandlordId } = require('../modules/notifications/notifications.service');

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/Lima';

// Recordatorio de pago: 3 días antes del vencimiento (una sola vez por pago)
async function paymentReminders() {
  const target = dayjs().tz(TZ).add(3, 'day');
  const start = target.startOf('day').toDate();
  const end = target.endOf('day').toDate();

  const payments = await prisma.payment.findMany({
    where: { status: PAYMENT_STATUS.PENDING, dueDate: { gte: start, lte: end } },
  });

  let notified = 0;
  for (const p of payments) {
    await createNotification({
      userId: p.tenantId,
      type: NOTIFICATION_TYPE.PAYMENT_DUE_SOON,
      message: `Tu pago #${p.id} vence en 3 días`,
      relatedEntity: 'Payment',
      relatedId: p.id,
      dedupeKey: `PAYMENT_DUE_SOON:${p.id}`,
    });
    notified += 1;
  }
  return { checked: payments.length, notified };
}

// Contratos próximos a vencer (dentro de 15 días), aviso al arrendador
async function contractsExpiring() {
  const today = dayjs().tz(TZ).startOf('day').toDate();
  const soon = dayjs().tz(TZ).add(15, 'day').endOf('day').toDate();

  const contracts = await prisma.contract.findMany({
    where: { status: CONTRACT_STATUS.ACTIVE, endDate: { gte: today, lte: soon } },
  });

  const landlordId = await getLandlordId();
  let notified = 0;
  if (landlordId) {
    for (const c of contracts) {
      const dateKey = dayjs(c.endDate).format('YYYYMMDD');
      await createNotification({
        userId: landlordId,
        type: NOTIFICATION_TYPE.CONTRACT_EXPIRING,
        message: `El contrato #${c.id} vence el ${dayjs(c.endDate).format('DD/MM/YYYY')}`,
        relatedEntity: 'Contract',
        relatedId: c.id,
        dedupeKey: `CONTRACT_EXPIRING:${c.id}:${dateKey}`,
      });
      notified += 1;
    }
  }
  return { checked: contracts.length, notified };
}

module.exports = { paymentReminders, contractsExpiring };
