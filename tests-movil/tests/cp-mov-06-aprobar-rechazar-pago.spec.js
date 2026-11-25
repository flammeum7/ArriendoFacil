import { test, expect } from '@playwright/test';
import { PagosPage } from '../pages/PagosPage.js';
import { ESTADO_SESION, PERMITIR_ESCRITURA } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarDentroDelAncho,
  verificarTamanoTactil,
  registrarHallazgo,
  capturarEvidencia,
} from '../utils/responsive.js';

test.use({ storageState: ESTADO_SESION.arrendador });

test.describe('CP-MOV-06 Aprobar o rechazar un pago', () => {
  test('CP-MOV-06 La confirmación y el modal de rechazo funcionan en pantalla táctil', async ({ page }, testInfo) => {
    // Arrange
    const errores = vigilarConsola(page);
    const pagos = new PagosPage(page);
    await pagos.abrir('arrendador');
    await pagos.filtroEstado().selectOption({ label: 'Por validar' });
    await pagos.esperarTabla();
    await verificarSinScrollHorizontal(page, 'en /payments');
    test.skip((await pagos.botonesAprobar.count()) === 0, 'No hay pagos "Por validar" para aprobar/rechazar');

    // Assert – interacción: botones de la fila con tamaño táctil
    await pagos.botonesAprobar.first().scrollIntoViewIfNeeded();
    await verificarTamanoTactil(pagos.botonesAprobar.first(), 'Botón Aprobar');
    await verificarTamanoTactil(pagos.botonesRechazar.first(), 'Botón Rechazar');
    await capturarEvidencia(page, testInfo, 'CP-MOV-06', 'por-validar');

    // Act – Rechazar: abrir el modal
    const idRechazo = await pagos.abrirModalRechazo();

    // Assert – modal adaptado a la pantalla
    await verificarDentroDelAncho(page, pagos.modalRechazo, 'Modal Rechazar comprobante');
    await expect(pagos.motivoRechazo).toBeVisible();
    await verificarTamanoTactil(pagos.botonConfirmarRechazo, 'Botón Rechazar del modal');
    if ((await pagos.modalRechazo.getByLabel('Motivo del rechazo').count()) === 0) {
      registrarHallazgo(testInfo, 'Accesibilidad: el textarea "Motivo del rechazo" no está asociado a su <label>');
    }

    // Act – confirmar el rechazo sin motivo (validación en el cliente, no guarda nada)
    await pagos.botonConfirmarRechazo.click();

    // Assert – el mensaje de validación se ve sin hacer scroll
    await expect(pagos.errorRechazo).toBeVisible();
    await expect(pagos.errorRechazo).toBeInViewport();
    await capturarEvidencia(page, testInfo, 'CP-MOV-06', 'rechazo-validacion');

    // Act – escribir un motivo (teclado de texto) y cancelar
    await pagos.motivoRechazo.click();
    await pagos.motivoRechazo.fill('Comprobante ilegible (prueba móvil)');
    await expect(pagos.motivoRechazo).toHaveValue(/ilegible/);
    await pagos.botonCancelarRechazo.click();

    // Assert
    await expect(pagos.modalRechazo).toBeHidden();
    await expect(pagos.filas(`#${idRechazo}`)).toContainText('Por validar');

    // Act – Aprobar: aparece la confirmación nativa del navegador
    const mensaje = await pagos.aprobarPrimero(PERMITIR_ESCRITURA);

    // Assert
    expect(mensaje).toMatch(/¿Aprobar el pago #\d+\?/);
    testInfo.annotations.push({
      type: 'modo',
      description: PERMITIR_ESCRITURA
        ? `Se ACEPTÓ la confirmación: "${mensaje}"`
        : `Se CANCELÓ la confirmación (PERMITIR_ESCRITURA=false): "${mensaje}"`,
    });
    await pagos.esperarTabla();
    await verificarSinScrollHorizontal(page, 'tras la confirmación');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-06', 'final');
  });
});
