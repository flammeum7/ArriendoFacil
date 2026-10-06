/**
 * SPRINT 1 — Pruebas Unitarias
 * CP-02: Validación de campos de registro de arrendatarios (DNI, correo).
 */
const schemas = require('../src/modules/tenants/tenants.validation');

describe('CP-02 - Validación de campos de registro (RF-02)', () => {
  test('acepta un arrendatario con datos válidos', () => {
    const r = schemas.create.safeParse({
      body: {
        fullName: 'Carlos Ramirez',
        dni: '43217896',
        email: 'carlos@example.com',
        phone: '998877665',
      },
    });
    expect(r.success).toBe(true);
  });

  test('rechaza un DNI que no tiene 8 dígitos', () => {
    const r = schemas.create.safeParse({
      body: {
        fullName: 'Carlos Ramirez',
        dni: '123',
        email: 'carlos@example.com',
      },
    });
    expect(r.success).toBe(false);
  });

  test('rechaza un correo con formato inválido', () => {
    const r = schemas.create.safeParse({
      body: {
        fullName: 'Carlos Ramirez',
        dni: '43217896',
        email: 'correo-invalido',
      },
    });
    expect(r.success).toBe(false);
  });

  test('rechaza cuando falta el nombre', () => {
    const r = schemas.create.safeParse({
      body: {
        dni: '43217896',
        email: 'carlos@example.com',
      },
    });
    expect(r.success).toBe(false);
  });
});