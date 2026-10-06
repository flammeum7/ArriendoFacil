/**
 * SPRINT 4 — Pruebas de Seguridad
 * SEG-05: Solo el arrendador puede aprobar pagos
 * (un arrendatario no puede aprobar su propio pago).
 */
const request = require('supertest');
const app = require('../src/app');
const {
  prisma, resetDb, seedLandlord, seedTenant, seedProperty,
  seedActiveContract, seedPendingPayment,
} = require('./helpers/db');

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

describe('SEG-05 - Solo el arrendador puede aprobar pagos (RF-10)', () => {
  test('un arrendatario NO puede aprobar un pago (403)', async () => {
    const tokenTenant = await login('maria.tenant@example.com', 'Tenant2026');
    const res = await request(app)
      .post(`/api/payments/${payment.id}/approve`)
      .set('Authorization', `Bearer ${tokenTenant}`);

    expect(res.status).toBe(403); // prohibido por rol
  });

  test('un arrendatario NO puede rechazar un pago (403)', async () => {
    const tokenTenant = await login('maria.tenant@example.com', 'Tenant2026');
    const res = await request(app)
      .post(`/api/payments/${payment.id}/reject`)
      .set('Authorization', `Bearer ${tokenTenant}`)
      .send({ reason: 'Comprobante ilegible' });

    expect(res.status).toBe(403);
  });
});