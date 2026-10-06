/**
 * SPRINT 2 — Pruebas Unitarias
 * CP-01: Validación de fechas del contrato (fin no anterior al inicio).
 */
const contractsService = require('../src/modules/contracts/contracts.service');

describe('CP-01 - Validación de fechas del contrato (RF-06)', () => {
  test('rechaza un contrato cuya fecha de fin es anterior a la de inicio', async () => {
    const datosInvalidos = {
      tenantId: 1,
      propertyId: 1,
      startDate: '2026-01-10',
      endDate: '2026-01-05', // fin antes que inicio
      rent: 1200,
      deposit: 1200,
    };

    await expect(
      contractsService.create(1, datosInvalidos)
    ).rejects.toThrow('La fecha de vencimiento no puede ser anterior a la fecha de inicio');
  });
});