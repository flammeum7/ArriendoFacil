/**
 * SPRINT 4 — Pruebas Unitarias
 * CP-09: Cálculo del ciclo de facturación (función getCycle).
 */
const { getCycle, getCurrentCycleIndex } = require('../src/utils/billingCycle');

describe('CP-09 - Cálculo del ciclo de facturación (getCycle)', () => {
  test('calcula el primer ciclo con vencimiento a 5 días del inicio', () => {
    const r = getCycle('2026-09-15', 0, 5);
    expect(r.periodStart.toISOString().slice(0, 10)).toBe('2026-09-15');
    expect(r.periodEnd.toISOString().slice(0, 10)).toBe('2026-10-14');
    expect(r.dueDate.toISOString().slice(0, 10)).toBe('2026-09-20');
  });

  test('calcula el segundo ciclo (cycleIndex = 1)', () => {
    const r = getCycle('2026-09-15', 1, 5);
    expect(r.periodStart.toISOString().slice(0, 10)).toBe('2026-10-15');
    expect(r.periodEnd.toISOString().slice(0, 10)).toBe('2026-11-14');
  });

  test('getCurrentCycleIndex devuelve los meses transcurridos', () => {
    expect(getCurrentCycleIndex('2026-09-15', '2026-11-20')).toBe(2);
  });

  test('getCurrentCycleIndex devuelve -1 antes de la fecha de inicio', () => {
    expect(getCurrentCycleIndex('2026-09-15', '2026-08-01')).toBe(-1);
  });
});