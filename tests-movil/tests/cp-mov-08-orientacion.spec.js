import { test, expect } from '@playwright/test';
import { ContratosPage } from '../pages/ContratosPage.js';
import { ESTADO_SESION } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarDentroDelAncho,
  capturarEvidencia,
} from '../utils/responsive.js';

test.use({ storageState: ESTADO_SESION.arrendador });

test.describe('CP-MOV-08 Orientación horizontal', () => {
  test('CP-MOV-08 Al girar el dispositivo la interfaz se reacomoda sin cortes', async ({ page, isMobile }, testInfo) => {
    test.skip(!isMobile, 'La rotación solo aplica a teléfonos y tablets');

    // Arrange – abrir Contratos en vertical
    const errores = vigilarConsola(page);
    const contratos = new ContratosPage(page);
    const vertical = page.viewportSize();
    await contratos.abrir();
    await capturarEvidencia(page, testInfo, 'CP-MOV-08', 'vertical');

    // Act – girar a horizontal (se intercambian ancho y alto)
    await page.setViewportSize({ width: vertical.height, height: vertical.width });
    testInfo.annotations.push({
      type: 'orientación',
      description: `${vertical.width}x${vertical.height} → ${vertical.height}x${vertical.width}` +
        (contratos.esModoHamburguesa() ? ' (sigue en modo hamburguesa)' : ' (pasa a menú lateral fijo)'),
    });

    // Assert – diseño adaptable en horizontal
    await expect(contratos.titulo).toBeVisible();
    await verificarSinScrollHorizontal(page, 'en horizontal');
    await verificarDentroDelAncho(page, contratos.contenedorTabla(), 'Tabla en horizontal');
    if (contratos.esModoHamburguesa()) {
      await expect(contratos.hamburguesa).toBeVisible();
    } else {
      await expect(contratos.enlaceMenu('Contratos')).toBeVisible();
    }
    await capturarEvidencia(page, testInfo, 'CP-MOV-08', 'horizontal');

    // Act – abrir el formulario con poca altura disponible
    await contratos.abrirModalNuevo();

    // Assert – el modal no supera el alto de la pantalla y su botón final se alcanza
    const caja = await contratos.modalNuevo.boundingBox();
    expect.soft(caja?.height ?? Infinity, 'Modal cabe en el alto de la pantalla')
      .toBeLessThanOrEqual(vertical.width);
    await contratos.botonCrear.scrollIntoViewIfNeeded();
    await expect(contratos.botonCrear).toBeInViewport();
    await capturarEvidencia(page, testInfo, 'CP-MOV-08', 'horizontal-modal');
    await contratos.cancelarModal();

    // Act – volver a vertical
    await page.setViewportSize(vertical);

    // Assert – se recupera el diseño original
    await verificarSinScrollHorizontal(page, 'al volver a vertical');
    await expect(contratos.titulo).toBeVisible();
    verificarSinErroresConsola(errores);
  });
});
