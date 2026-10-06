/**
 * SPRINT 2 — Pruebas de Seguridad
 * SEG-03: Integridad validada en el backend (rechaza datos manipulados
 * aunque se evada el frontend).
 */
const request = require('supertest');
const app = require('../src/app');
const {
  prisma, resetDb, seedLandlord, seedTenant, seedProperty,
} = require('./helpers/db');

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

let landlord, tenant, property;
beforeEach(async () => {
  await resetDb();
  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
});
afterAll(async () => { await prisma.$disconnect(); });

describe('SEG-03 - Integridad validada en el backend (RF-06)', () => {
  test('rechaza un contrato con fecha de fin anterior al inicio (vía API)', async () => {
    const token = await login('admin@arriendofacil.com', 'Admin2026');
    const res = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        propertyId: property.id,
        startDate: '2026-12-31',
        endDate: '2026-01-01', // inválido
        rent: 1200,
        deposit: 1200,
      });

    expect([400, 409, 422]).toContain(res.status);
  });

  test('rechaza un contrato con monto negativo (vía API)', async () => {
    const token = await login('admin@arriendofacil.com', 'Admin2026');
    const res = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        propertyId: property.id,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        rent: -500, // inválido
        deposit: 1200,
      });

    expect([400, 409, 422]).toContain(res.status);
  });
});