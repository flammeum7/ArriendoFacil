const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const prisma = require('../../config/prisma');
const {
  ROLES,
  PAYMENT_STATUS,
  CONTRACT_STATUS,
  INCIDENT_STATUS,
} = require('../../config/constants');

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/Lima';

function monthRange() {
  const now = dayjs().tz(TZ);
  return { start: now.startOf('month').toDate(), end: now.endOf('month').toDate() };
}

async function landlord() {
  const { start, end } = monthRange();
  const today = dayjs().tz(TZ).startOf('day').toDate();
  const soon = dayjs().tz(TZ).add(30, 'day').endOf('day').toDate();

  const [
    totalTenants,
    totalProperties,
    paidAgg,
    pendingPayments,
    overduePayments,
    contractsExpiring,
    openIncidents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: ROLES.TENANT, active: true } }),
    prisma.property.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: PAYMENT_STATUS.PAID, paymentDate: { gte: start, lte: end } },
    }),
    prisma.payment.count({ where: { status: PAYMENT_STATUS.PENDING } }),
    prisma.payment.count({ where: { status: PAYMENT_STATUS.OVERDUE } }),
    prisma.contract.count({
      where: { status: CONTRACT_STATUS.ACTIVE, endDate: { gte: today, lte: soon } },
    }),
    prisma.incident.count({
      where: { status: { in: [INCIDENT_STATUS.OPEN, INCIDENT_STATUS.IN_PROGRESS] } },
    }),
  ]);

  return {
    totalTenants,
    totalProperties,
    monthlyRevenue: Number(paidAgg._sum.amount ?? 0),
    pendingPayments,
    overduePayments,
    contractsExpiring,
    openIncidents,
  };
}

async function tenant(userId) {
  const activeContract = await prisma.contract.findFirst({
    where: { tenantId: userId, status: CONTRACT_STATUS.ACTIVE },
    include: { property: true },
    orderBy: { createdAt: 'desc' },
  });

  const nextPayment = await prisma.payment.findFirst({
    where: {
      tenantId: userId,
      status: { in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.OVERDUE] },
    },
    orderBy: { dueDate: 'asc' },
  });

  const [paymentsCount, documentsCount, incidentsCount, unread] = await Promise.all([
    prisma.payment.count({ where: { tenantId: userId } }),
    prisma.document.count({ where: { ownerId: userId, deletedAt: null } }),
    prisma.incident.count({ where: { tenantId: userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    assignedProperty: activeContract
      ? { id: activeContract.property.id, address: activeContract.property.address }
      : null,
    contract: activeContract
      ? {
          id: activeContract.id,
          startDate: activeContract.startDate,
          endDate: activeContract.endDate,
          rent: activeContract.rent,
          status: activeContract.status,
        }
      : null,
    nextPayment: nextPayment
      ? {
          id: nextPayment.id,
          periodStart: nextPayment.periodStart,
          dueDate: nextPayment.dueDate,
          amount: nextPayment.amount,
          status: nextPayment.status,
        }
      : null,
    paymentsCount,
    documentsCount,
    incidentsCount,
    unreadNotifications: unread,
  };
}

module.exports = { landlord, tenant };
