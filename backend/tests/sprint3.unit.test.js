/**
 * SPRINT 3 — Pruebas Unitarias
 * CP-07: Validación de formato y tamaño de archivo (reglas aisladas).
 */
const { RECEIPT_MIMES } = require('../src/middlewares/upload');

const MAX_SIZE_MB = 5;

function formatoPermitido(mimetype) {
  return RECEIPT_MIMES.includes(mimetype);
}
function tamanoPermitido(sizeBytes) {
  return sizeBytes <= MAX_SIZE_MB * 1024 * 1024;
}

describe('CP-07 - Validación de formato y tamaño de archivo (RF-09)', () => {
  test('acepta un PDF dentro del tamaño permitido', () => {
    expect(formatoPermitido('application/pdf')).toBe(true);
    expect(tamanoPermitido(2 * 1024 * 1024)).toBe(true);
  });

  test('acepta imágenes JPG y PNG', () => {
    expect(formatoPermitido('image/jpeg')).toBe(true);
    expect(formatoPermitido('image/png')).toBe(true);
  });

  test('rechaza un formato no permitido (.txt)', () => {
    expect(formatoPermitido('text/plain')).toBe(false);
  });

  test('rechaza un archivo que supera el tamaño máximo (6 MB)', () => {
    expect(tamanoPermitido(6 * 1024 * 1024)).toBe(false);
  });
});