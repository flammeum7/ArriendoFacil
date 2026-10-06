
import { test, expect } from '@playwright/test';

test('CF-03 - Visualizar documentos del arrendatario', async ({ page }) => {
  // =====================================================
  // 1. INICIAR SESIÓN COMO ARRENDATARIO
  // =====================================================

  await page.goto('/');

  await expect(
    page.getByText('ArriendoFácil')
  ).toBeVisible();

  await page
    .getByLabel('Correo electrónico')
    .fill('hc@gmail.com');

  await page
    .getByLabel('Contraseña')
    .fill('12345678');

  await page
    .getByRole('button', { name: 'Ingresar' })
    .click();

  // =====================================================
  // 2. VERIFICAR DASHBOARD DEL ARRENDATARIO
  // =====================================================

  await expect(
    page.getByRole('heading', { name: 'Resumen' })
  ).toBeVisible();

  await expect(
    page.getByText('Tu información de arrendamiento')
  ).toBeVisible();

  // Verificar que estamos como arrendatario
  await expect(
    page.getByText('Arrendatario', { exact: true })
  ).toBeVisible();

  // =====================================================
  // 3. IR A MIS DOCUMENTOS
  // =====================================================

  await page
    .getByRole('link', { name: 'Mis documentos' })
    .click();

  // =====================================================
  // 4. VERIFICAR PANTALLA DE DOCUMENTOS
  // =====================================================

  await expect(
    page.getByRole('heading', { name: 'Documentos' })
  ).toBeVisible();

  await expect(
    page.getByText('Tus documentos')
  ).toBeVisible();

  // Verificar las columnas principales
  await expect(
    page.getByText('Archivo', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Tipo', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Fecha', { exact: true })
  ).toBeVisible();

  // =====================================================
  // 5. VERIFICAR DOCUMENTOS DEL ARRENDATARIO
  // =====================================================

  // Gerardo tiene 3 documentos registrados.
  // Buscamos los botones "Ver" correspondientes.

  const botonesVer = page.getByRole('button', {
    name: 'Ver',
    exact: true
  });

  await expect(botonesVer).toHaveCount(3);

  // Verificar que existe un Contrato
  await expect(
    page.getByText('Contrato', { exact: true })
  ).toBeVisible();

  // Verificar que existe una Boleta/Factura
  await expect(
    page.getByText('Boleta/Factura', { exact: true })
  ).toBeVisible();

  // =====================================================
  // 6. ABRIR UN DOCUMENTO
  // =====================================================

  // Guardamos la cantidad de páginas abiertas
  // antes de hacer clic.
  const paginasAntes = page.context().pages().length;

  // Hacer clic en el primer documento
  await botonesVer.first().click();

  // Esperar a que se abra la nueva pestaña.
  await expect
    .poll(() => page.context().pages().length)
    .toBeGreaterThan(paginasAntes);

  // Obtener la nueva pestaña
  const paginas = page.context().pages();

  const nuevaPagina = paginas[paginas.length - 1];

  // Esperar a que termine de cargar
  await nuevaPagina.waitForLoadState('domcontentloaded');

  // Verificar que la nueva pestaña tiene una URL
  expect(nuevaPagina.url()).not.toBe('');

  // =====================================================
  // 7. VERIFICAR QUE EL DOCUMENTO SE PUEDE VISUALIZAR
  // =====================================================

  // La nueva pestaña debe corresponder a un recurso
  // diferente de la pantalla principal.
  expect(nuevaPagina.url()).not.toBe(page.url());

});
