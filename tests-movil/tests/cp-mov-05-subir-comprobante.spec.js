import { test, expect } from '@playwright/test';
import { PagosPage } from '../pages/PagosPage.js';
import { ESTADO_SESION, PERMITIR_ESCRITURA, tieneCuenta } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarDentroDelAncho,
  verificarTamanoTactil,
  registrarHallazgo,
  capturarEvidencia,
} from '../utils/responsive.js';

// Este caso lo realiza el ARRENDATARIO
test.use({ storageState: ESTADO_SESION.arrendatario });

/** PNG de 1x1 px generado en memoria (simula la foto del comprobante) */
const COMPROBANTE = {
  name: 'comprobante-prueba.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  ),
};

test.describe('CP-MOV-05 Subir comprobante de pago', () => {
  test('CP-MOV-05 El modal de subida se adapta y acepta una imagen desde el teléfono', async ({ page }, testInfo) => {
    test.skip(!tieneCuenta('arrendatario'), 'Faltan TEST_TENANT_EMAIL / TEST_TENANT_PASSWORD en .env');

    // Arrange
    const errores = vigilarConsola(page);
    const pagos = new PagosPage(page);
    await pagos.abrir('arrendatario');
    await verificarSinScrollHorizontal(page, 'en /payments');
    test.skip((await pagos.botonesSubir.count()) === 0,
      'El arrendatario no tiene pagos Pendientes/Vencidos/Rechazados para subir comprobante');
    await verificarTamanoTactil(pagos.botonesSubir.first(), 'Botón Subir comprobante');

    // Act – abrir el modal
    const idPago = await pagos.abrirModalSubir();

    // Assert – diseño adaptable e interacción del modal
    await verificarDentroDelAncho(page, pagos.modalSubir, 'Modal Subir comprobante');
    await expect(pagos.inputArchivo).toHaveAttribute('accept', /\.jpg/);
    await expect(pagos.inputArchivo).toHaveAttribute('accept', /\.pdf/);
    if ((await pagos.inputArchivo.getAttribute('capture')) === null) {
      registrarHallazgo(testInfo, 'El input de archivo no tiene "capture": el móvil ofrece elegir entre cámara y galería (verificar cámara real de forma manual)');
    }
    if ((await pagos.modalSubir.getByLabel('Método de pago').count()) === 0) {
      registrarHallazgo(testInfo, 'Accesibilidad: "Archivo" y "Método de pago" no están asociados a su <label> (sin id/htmlFor)');
    }
    await verificarTamanoTactil(pagos.metodoPago, 'Selector Método de pago');
    await verificarTamanoTactil(pagos.botonConfirmarSubida, 'Botón Subir');
    await capturarEvidencia(page, testInfo, 'CP-MOV-05', 'modal');

    // Act – adjuntar la imagen y elegir el método
    await pagos.adjuntarComprobante(COMPROBANTE);
    await pagos.metodoPago.selectOption({ label: 'Yape' });

    // Assert – el archivo quedó seleccionado
    const nombre = await pagos.inputArchivo.evaluate((el) => el.files?.[0]?.name);
    expect(nombre).toBe(COMPROBANTE.name);
    await expect(pagos.metodoPago).toHaveValue('YAPE');
    await capturarEvidencia(page, testInfo, 'CP-MOV-05', 'archivo-adjunto');

    if (!PERMITIR_ESCRITURA) {
      testInfo.annotations.push({ type: 'modo', description: 'PERMITIR_ESCRITURA=false: se canceló sin subir' });
      await pagos.botonCancelarSubida.click();
      await expect(pagos.modalSubir).toBeHidden();
      verificarSinErroresConsola(errores);
      return;
    }

    // Act – subir de verdad
    await pagos.botonConfirmarSubida.click();

    // Assert – el modal se cierra y el pago pasa a "Por validar"
    await expect(pagos.modalSubir).toBeHidden({ timeout: 30_000 });
    await expect(pagos.filas(`#${idPago}`)).toContainText('Por validar');
    await verificarSinScrollHorizontal(page, 'tras subir el comprobante');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-05', 'subido');
  });
});
