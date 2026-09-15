/**
 * CP-01 — Prueba UNITARIA: validacion de fechas del contrato (RF-06).
 *
 * La regla "la fecha de vencimiento no puede ser anterior a la de inicio"
 * vive dentro de contracts.service (funcion interna validateDates, invocada
 * por create()). Como no se exporta directamente, la probamos a traves de
 * create() con datos minimos, verificando que rechaza fechas invalidas ANTES
 * de tocar la base de datos (la validacion de fechas ocurre primero).
 *
 * Es unitaria porque aisla una unica regla de negocio (orden de fechas),
 * sin depender del resto del flujo.
 */
const contractsService = require('../src/modules/contracts/contracts.service');

describe('CP-01 - Validacion de fechas del contrato (RF-06)', () => {
  test('rechaza un contrato cuya fecha de fin es anterior a la de inicio', async () => {
    const datosInvalidos = {
      tenantId: 1,
      propertyId: 1,
      startDate: '2026-01-10',
      endDate: '2026-01-05', // fin ANTES que inicio -> invalido
      rent: 1200,
      deposit: 1200,
    };

    // Esperamos que create() lance un error de fechas (ApiError.badRequest)
    await expect(contractsService.create(1, datosInvalidos)).rejects.toThrow(
      'La fecha de vencimiento no puede ser anterior a la fecha de inicio'
    );
  });
});
