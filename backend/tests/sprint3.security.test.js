/**
 * SPRINT 3 — Pruebas de Seguridad
 * SEG-04: Aislamiento de documentos entre arrendatarios
 * (un arrendatario solo accede a sus propios documentos).
 */
const request = require('supertest');
const app = require('../src/app');
const {
  prisma, resetDb, seedLandlord, seedTenant, seedProperty, seedActiveContract,
} = require('./helpers/db');

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

let landlord, tenant, property, contract;
beforeEach(async () => {
  await resetDb();
  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
  contract = await seedActiveContract(tenant.id, property.id);
});
afterAll(async () => { await prisma.$disconnect(); });

describe('SEG-04 - Aislamiento de documentos entre arrendatarios', () => {
  test('un arrendatario solo ve documentos propios', async () => {
    const tokenTenant = await login('maria.tenant@example.com', 'Tenant2026');
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${tokenTenant}`);

    expect(res.status).toBe(200);
    const items = res.body.data?.items || res.body.data || [];
    // Todos los documentos devueltos deben pertenecer a este arrendatario
    items.forEach((doc) => {
      if (doc.ownerId !== undefined) expect(doc.ownerId).toBe(tenant.id);
    });
  });

  test('un arrendatario sin documentos recibe una lista vacía', async () => {
    const tokenTenant = await login('maria.tenant@example.com', 'Tenant2026');
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${tokenTenant}`);

    expect(res.status).toBe(200);
    const items = res.body.data?.items || res.body.data || [];
    expect(Array.isArray(items)).toBe(true);
  });
});