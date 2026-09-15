/**
 * CP-02 — Prueba UNITARIA: motivo de rechazo minimo (RF-11).
 *
 * El schema Zod "reject" (payments.validation.js) exige que el motivo de
 * rechazo tenga al menos 3 caracteres. Esta prueba valida esa regla de forma
 * aislada usando .safeParse(), sin tocar la base de datos ni la API.
 */
const schemas = require('../src/modules/payments/payments.validation');

describe('CP-02 - Motivo de rechazo minimo de 3 caracteres (RF-11)', () => {
  test('rechaza un motivo de 2 caracteres', () => {
    const resultado = schemas.reject.safeParse({
      body: { reason: 'no' }, // 2 caracteres -> invalido
      params: { id: '1' },
    });
    expect(resultado.success).toBe(false);
  });

  test('rechaza un motivo vacio', () => {
    const resultado = schemas.reject.safeParse({
      body: { reason: '' },
      params: { id: '1' },
    });
    expect(resultado.success).toBe(false);
  });

  test('acepta un motivo de 3 o mas caracteres', () => {
    const resultado = schemas.reject.safeParse({
      body: { reason: 'Comprobante ilegible' },
      params: { id: '1' },
    });
    expect(resultado.success).toBe(true);
  });
});
