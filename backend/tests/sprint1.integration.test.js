/**
 * SPRINT 1 — Pruebas de Integración
 * CP-06: Registro de arrendatario vía API (servicio + BD).
 */
const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, seedLandlord } = require('./helpers/db');

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.accessToken;
}

beforeEach(async () => {
  await resetDb();
  await seedLandlord();
});
afterAll(async () => { await prisma.$disconnect(); });

describe('CP-06 - Registro de arrendatario vía API (RF-02)', () => {
  test('el arrendador registra un arrendatario y se guarda en la BD', async () => {
    const token = await login('admin@arriendofacil.com', 'Admin2026');
    const res = await request(app)
      .post('/api/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Carlos Ramirez',
        dni: '43217896',
        email: 'carlos.ramirez@example.com',
        phone: '998877665',
      });

    expect([200, 201]).toContain(res.status);

    const creado = await prisma.user.findUnique({
      where: { email: 'carlos.ramirez@example.com' },
    });
    expect(creado).not.toBeNull();
    expect(creado.dni).toBe('43217896');
  });

  test('rechaza registrar un arrendatario con correo duplicado', async () => {
    const token = await login('admin@arriendofacil.com', 'Admin2026');
    const datos = {
      fullName: 'Carlos Ramirez',
      dni: '43217896',
      email: 'duplicado@example.com',
      phone: '998877665',
    };
    // primer registro
    await request(app).post('/api/tenants').set('Authorization', `Bearer ${token}`).send(datos);
    // segundo registro con el mismo correo
    const res = await request(app)
      .post('/api/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...datos, dni: '41258963' });

    expect([400, 409]).toContain(res.status);
  });
});