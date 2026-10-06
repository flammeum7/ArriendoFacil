/**
 * SPRINT 1 — Pruebas de Seguridad
 * SEG-01: Inicio de sesión exitoso (token JWT).
 * SEG-02: Denegación de inicio de sesión con credenciales inválidas.
 */
const request = require('supertest');
const app = require('../src/app');
const { prisma, resetDb, seedLandlord } = require('./helpers/db');

beforeEach(async () => {
  await resetDb();
  await seedLandlord();
});
afterAll(async () => { await prisma.$disconnect(); });

describe('SEG-01 - Inicio de sesión exitoso', () => {
  test('con credenciales válidas devuelve un accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@arriendofacil.com', password: 'Admin2026' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

describe('SEG-02 - Denegación de inicio de sesión', () => {
  test('con contraseña incorrecta deniega el acceso', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@arriendofacil.com', password: 'claveIncorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.data?.accessToken).toBeUndefined();
  });

  test('con correo inexistente deniega el acceso', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'Admin2026' });

    expect(res.status).toBe(401);
  });

  test('una ruta protegida sin token responde 401', async () => {
    const res = await request(app).get('/api/tenants');
    expect(res.status).toBe(401);
  });
});