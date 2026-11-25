import { test, expect } from '@playwright/test';
import { AppLayoutPage } from '../pages/AppLayoutPage.js';
import { ESTADO_SESION } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarTamanoTactil,
  capturarEvidencia,
} from '../utils/responsive.js';

test.use({ storageState: ESTADO_SESION.arrendador });

test.describe('CP-MOV-02 Menú de navegación', () => {
  test('CP-MOV-02 En móvil el menú lateral se convierte en hamburguesa y permite navegar', async ({ page }, testInfo) => {
    // Arrange
    const errores = vigilarConsola(page);
    const app = new AppLayoutPage(page);
    await app.abrirRuta('/');
    await expect(app.titulo).toHaveText('Resumen');
    const modoHamburguesa = app.esModoHamburguesa();
    testInfo.annotations.push({
      type: 'modo',
      description: modoHamburguesa
        ? `Ancho ${page.viewportSize().width}px ≤ 860px: menú hamburguesa`
        : `Ancho ${page.viewportSize().width}px > 860px: menú lateral fijo`,
    });

    // Assert – diseño adaptable del estado inicial
    await verificarSinScrollHorizontal(page, 'en Resumen');
    if (modoHamburguesa) {
      await expect(app.hamburguesa).toBeVisible();
      await expect(app.menuLateral, 'Menú lateral oculto fuera de pantalla').not.toBeInViewport();
      await verificarTamanoTactil(app.hamburguesa, 'Botón hamburguesa');
    } else {
      await expect(app.hamburguesa).toBeHidden();
      await expect(app.menuLateral).toBeInViewport();
    }
    await capturarEvidencia(page, testInfo, 'CP-MOV-02', 'inicial');

    if (modoHamburguesa) {
      // Act – abrir el menú
      await app.abrirMenu();

      // Assert – menú abierto con enlaces visibles y táctiles
      await expect(app.capaOscura).toBeVisible();
      await expect(app.enlaceMenu('Contratos')).toBeVisible();
      await verificarTamanoTactil(app.enlaceMenu('Contratos'), 'Enlace Contratos del menú');
      await capturarEvidencia(page, testInfo, 'CP-MOV-02', 'menu-abierto');

      // Act – cerrar tocando fuera del menú
      await app.cerrarMenuConCapa();

      // Assert
      await expect(app.capaOscura).toBeHidden();
    }

    // Act – navegar a Contratos desde el menú
    await app.irDesdeMenu('Contratos');

    // Assert – llega a la pantalla y (en móvil) el menú se cierra solo
    await expect(page).toHaveURL(/\/contracts$/);
    await expect(app.titulo).toHaveText('Contratos');
    if (modoHamburguesa) {
      await expect(app.menuLateral, 'El menú se cierra tras navegar').not.toBeInViewport();
    }
    await verificarTamanoTactil(app.botonSalir, 'Botón Salir');
    await verificarSinScrollHorizontal(page, 'tras navegar a Contratos');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-02', 'navegado');
  });
});
