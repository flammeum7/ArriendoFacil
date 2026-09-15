/**
 * Utilidades compartidas por las pruebas:
 *  - prisma: instancia unica del cliente Prisma (apunta a la BD de test).
 *  - resetDb(): limpia todas las tablas para dejar un estado inicial conocido.
 *  - seedLandlord/seedTenant/seedProperty/... : crean datos ficticios de prueba.
 *
 * Todos los datos son de ejemplo (no reales), como exige el plan de pruebas.
 * Los nombres de campos coinciden exactamente con prisma/schema.prisma.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const {
  ROLES,
  PROPERTY_TYPE,
  PROPERTY_STATUS,
  CONTRACT_STATUS,
  PAYMENT_STATUS,
} = require('../../src/config/constants');

const prisma = new PrismaClient();

async function resetDb() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.incidentAttachment.deleteMany();
  await prisma.incidentResponse.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
}

async function seedLandlord() {
  const passwordHash = await bcrypt.hash('Admin2026', 10);
  return prisma.user.create({
    data: {
      role: ROLES.LANDLORD,
      fullName: 'Administrador ArriendoFacil',
      email: 'admin@arriendofacil.com',
      passwordHash,
      active: true,
    },
  });
}

async function seedTenant(overrides = {}) {
  const passwordHash = await bcrypt.hash('Tenant2026', 10);
  return prisma.user.create({
    data: {
      role: ROLES.TENANT,
      fullName: overrides.fullName || 'Maria Fernandez',
      email: overrides.email || 'maria.tenant@example.com',
      dni: overrides.dni || '45123789',
      phone: overrides.phone || '987654321',
      passwordHash,
      active: overrides.active !== undefined ? overrides.active : true,
    },
  });
}

async function seedProperty(ownerId, overrides = {}) {
  return prisma.property.create({
    data: {
      address: overrides.address || 'Av. Los Olivos 123 - Depto. 101',
      type: overrides.type || PROPERTY_TYPE.APARTMENT,
      unitNumber: overrides.unitNumber || '101',
      description: overrides.description || 'Departamento de prueba',
      rooms: overrides.rooms || 3,
      referenceRent: overrides.referenceRent || 1200,
      status: overrides.status || PROPERTY_STATUS.AVAILABLE,
      ownerId,
    },
  });
}

async function seedActiveContract(tenantId, propertyId, overrides = {}) {
  const contract = await prisma.contract.create({
    data: {
      tenantId,
      propertyId,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      rent: overrides.rent || 1200,
      deposit: overrides.deposit || 1200,
      conditions: overrides.conditions || null,
      dueDayOffset: overrides.dueDayOffset != null ? overrides.dueDayOffset : 5,
      status: CONTRACT_STATUS.ACTIVE,
      activePropertyKey: propertyId,
    },
  });
  await prisma.property.update({
    where: { id: propertyId },
    data: { status: PROPERTY_STATUS.OCCUPIED },
  });
  return contract;
}

async function seedPendingPayment(contractId, tenantId, overrides = {}) {
  return prisma.payment.create({
    data: {
      contractId,
      tenantId,
      amount: overrides.amount || 1200,
      periodStart: overrides.periodStart || new Date('2026-01-01T00:00:00.000Z'),
      periodEnd: overrides.periodEnd || new Date('2026-01-31T00:00:00.000Z'),
      dueDate: overrides.dueDate || new Date('2026-01-06T00:00:00.000Z'),
      status: PAYMENT_STATUS.PENDING,
    },
  });
}

module.exports = {
  prisma,
  resetDb,
  seedLandlord,
  seedTenant,
  seedProperty,
  seedActiveContract,
  seedPendingPayment,
};
