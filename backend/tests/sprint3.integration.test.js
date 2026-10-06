/**
 * SPRINT 3 — Pruebas de Integración
 * CP-08: Subida y recuperación de documento vía API.
 */
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const app = require('../src/app');

const {
  prisma,
  resetDb,
  seedLandlord,
  seedTenant,
  seedProperty,
  seedActiveContract,
} = require('./helpers/db');

async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return res.body.data.accessToken;
}

let landlord, tenant, property, contract;

beforeEach(async () => {
  await resetDb();

  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
  contract = await seedActiveContract(tenant.id, property.id);

  console.log('TENANT CREADO:', tenant);
  console.log('CONTRACT CREADO:', contract);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CP-08 - Subida y recuperación de documento (RF-09)', () => {
  test('el arrendador sube un documento y queda disponible en la BD', async () => {
    const pdf = path.join(__dirname, 'doc-demo.pdf');

    fs.writeFileSync(
      pdf,
      Buffer.from('255044462d312e34', 'hex')
    ); // cabecera PDF

    const token = await login(
      'admin@arriendofacil.com',
      'Admin2026'
    );

    console.log('DATOS ENVIADOS:', {
      ownerId: tenant.id,
      contractId: contract.id,
      type: 'CONTRACT',
    });

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('type', 'CONTRACT')
      .field('contractId', String(contract.id))
      .field('ownerId', String(tenant.id))
      .attach('file', pdf);

    console.log('RESPUESTA:', res.status, res.body);

    expect([200, 201]).toContain(res.status);

    const docs = await prisma.document.findMany({
      where: {
        contractId: contract.id,
      },
    });

    expect(docs.length).toBeGreaterThan(0);

    fs.unlinkSync(pdf);
  });
});