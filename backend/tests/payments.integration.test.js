/**
 * Pruebas de INTEGRACION de pagos vIa la API REST (Supertest).
 *  - CP-04: flujo completo comprobante -> aprobacion (RF-09, RF-10).
 *  - CP-05: aprobar un pago que NO esta en revision -> 409 (RF-10).
 *
 * Se prueba el flujo real controlador -> servicio -> base de datos, incluyendo
 * autenticacion por rol (login como TENANT y como LANDLORD).
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
  seedPendingPayment,
} = require('./helpers/db');
const { PAYMENT_STATUS } = require('../src/config/constants');

let landlord;
let tenant;
let property;
let contract;
let payment;

// Inicia sesion y devuelve el accessToken del usuario indicado
async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.accessToken;
}

beforeEach(async () => {
  await resetDb();
  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
  contract = await seedActiveContract(tenant.id, property.id);
  payment = await seedPendingPayment(contract.id, tenant.id);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CP-04 - Flujo comprobante -> aprobacion (RF-09, RF-10)', () => {
  test('el arrendatario sube comprobante y el arrendador lo aprueba (queda PAID)', async () => {
    // Archivo temporal que simula el comprobante (imagen pequena)
    const tmpFile = path.join(__dirname, 'receipt-demo.png');
    fs.writeFileSync(tmpFile, Buffer.from('89504e470d0a1a0a', 'hex')); // cabecera PNG minima

    // 1) Login como arrendatario y subir comprobante
    const tenantToken = await login('maria.tenant@example.com', 'Tenant2026');
    const uploadRes = await request(app)
      .post(`/api/payments/${payment.id}/receipt`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .attach('receipt', tmpFile);

    expect(uploadRes.status).toBe(200);

    // El pago debe quedar UNDER_REVIEW
    let actualizado = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(actualizado.status).toBe(PAYMENT_STATUS.UNDER_REVIEW);

    // 2) Login como arrendador y aprobar
    const landlordToken = await login('admin@arriendofacil.com', 'Admin2026');
    const approveRes = await request(app)
      .post(`/api/payments/${payment.id}/approve`)
      .set('Authorization', `Bearer ${landlordToken}`);

    expect(approveRes.status).toBe(200);

    // El pago debe quedar PAID con fecha de pago
    actualizado = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(actualizado.status).toBe(PAYMENT_STATUS.PAID);
    expect(actualizado.paymentDate).not.toBeNull();

    fs.unlinkSync(tmpFile); // limpieza del archivo temporal
  });
});

describe('CP-05 - Aprobar un pago que no esta en revision (RF-10)', () => {
  test('rechaza aprobar un pago en estado PENDING con 409 Conflict', async () => {
    // El pago sembrado esta en PENDING (no UNDER_REVIEW)
    const landlordToken = await login('admin@arriendofacil.com', 'Admin2026');

    const res = await request(app)
      .post(`/api/payments/${payment.id}/approve`)
      .set('Authorization', `Bearer ${landlordToken}`);

    expect(res.status).toBe(409);
  });
});
