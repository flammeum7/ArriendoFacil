/**
 * SPRINT 4 — Pruebas de Integración
 * CP-04: Flujo comprobante → aprobación (queda PAID).
 * CP-05: Aprobar un pago que no está en revisión → 409.
 */
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const app = require('../src/app');
const {
  prisma, resetDb, seedLandlord, seedTenant, seedProperty,
  seedActiveContract, seedPendingPayment,
} = require('./helpers/db');
const { PAYMENT_STATUS } = require('../src/config/constants');

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

let landlord, tenant, property, contract, payment;
beforeEach(async () => {
  await resetDb();
  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
  contract = await seedActiveContract(tenant.id, property.id);
  payment = await seedPendingPayment(contract.id, tenant.id);
});
afterAll(async () => { await prisma.$disconnect(); });

describe('CP-04 - Flujo comprobante → aprobación (RF-09, RF-10)', () => {
  test('el arrendatario sube comprobante y el arrendador lo aprueba (PAID)', async () => {
    const tmp = path.join(__dirname, 'receipt-demo.png');
    fs.writeFileSync(tmp, Buffer.from('89504e470d0a1a0a', 'hex'));

    const tenantToken = await login('maria.tenant@example.com', 'Tenant2026');
    const uploadRes = await request(app)
      .post(`/api/payments/${payment.id}/receipt`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .attach('receipt', tmp);
    expect(uploadRes.status).toBe(200);

    let actualizado = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(actualizado.status).toBe(PAYMENT_STATUS.UNDER_REVIEW);

    const landlordToken = await login('admin@arriendofacil.com', 'Admin2026');
    const approveRes = await request(app)
      .post(`/api/payments/${payment.id}/approve`)
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(approveRes.status).toBe(200);

    actualizado = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(actualizado.status).toBe(PAYMENT_STATUS.PAID);
    expect(actualizado.paymentDate).not.toBeNull();

    fs.unlinkSync(tmp);
  });
});

describe('CP-05 - Aprobar un pago que no está en revisión (RF-10)', () => {
  test('rechaza aprobar un pago en estado PENDING con 409 Conflict', async () => {
    const landlordToken = await login('admin@arriendofacil.com', 'Admin2026');
    const res = await request(app)
      .post(`/api/payments/${payment.id}/approve`)
      .set('Authorization', `Bearer ${landlordToken}`);

    expect(res.status).toBe(409);
  });
});