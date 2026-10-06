
import { test, expect } from '@playwright/test';

test('CF-02 - Crear contrato de alquiler', async ({ page }) => {
  // =====================================================
  // 1. INICIAR SESIÓN
  // =====================================================

  await page.goto('/');

  await expect(
    page.getByText('ArriendoFácil')
  ).toBeVisible();

  await page
    .getByLabel('Correo electrónico')
    .fill('admin@arriendofacil.com');

  await page
    .getByLabel('Contraseña')
    .fill('Admin2026');

  await page
    .getByRole('button', { name: 'Ingresar' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Resumen' })
  ).toBeVisible();

  // =====================================================
  // 2. IR A CONTRATOS
  // =====================================================

  await page
    .getByRole('link', { name: 'Contratos' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Contratos' })
  ).toBeVisible();

  await expect(
    page.getByText('Gestión de contratos de alquiler')
  ).toBeVisible();

  // =====================================================
  // 3. ABRIR NUEVO CONTRATO
  // =====================================================

  await page
    .getByRole('button', { name: /Nuevo contrato/i })
    .click();

  // Verificar que el modal está abierto
  await expect(
    page.getByText('Fecha de inicio', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Fecha de vencimiento', { exact: true })
  ).toBeVisible();

  // =====================================================
  // 4. SELECCIONAR ARRENDATARIO
  // =====================================================

  const arrendatario = page.getByLabel('Arrendatario');

  await expect(arrendatario).toBeVisible();

  // Obtener las opciones disponibles
  const opcionesArrendatario = arrendatario.locator('option');

  const cantidadArrendatarios =
    await opcionesArrendatario.count();

  // Debe existir al menos la opción "Selecciona..."
  expect(cantidadArrendatarios).toBeGreaterThan(1);

  // Seleccionar la primera opción real
  await arrendatario.selectOption({
    index: 1
  });

  // =====================================================
  // 5. SELECCIONAR PROPIEDAD
  // =====================================================

  const propiedad = page.getByLabel(/Propiedad/);

  await expect(propiedad).toBeVisible();

  const opcionesPropiedad = propiedad.locator('option');

  const cantidadPropiedades =
    await opcionesPropiedad.count();

  // Debe existir al menos una propiedad disponible
  expect(cantidadPropiedades).toBeGreaterThan(1);

  // Seleccionar la primera propiedad disponible
  await propiedad.selectOption({
    index: 1
  });

  // =====================================================
  // 6. COMPLETAR FECHA DE INICIO
  // =====================================================

  const fechaInicio = page.getByLabel('Fecha de inicio');

  await expect(fechaInicio).toBeVisible();

  await fechaInicio.fill('2026-10-01');

  // =====================================================
  // 7. COMPLETAR FECHA DE VENCIMIENTO
  // =====================================================

  const fechaVencimiento =
    page.getByLabel('Fecha de vencimiento');

  await expect(fechaVencimiento).toBeVisible();

  await fechaVencimiento.fill('2027-10-01');

  // =====================================================
  // 8. COMPLETAR ALQUILER MENSUAL
  // =====================================================

  const alquiler = page.getByLabel(/Alquiler mensual/i);

  await expect(alquiler).toBeVisible();

  await alquiler.fill('1000');

  // =====================================================
  // 9. COMPLETAR DEPÓSITO
  // =====================================================

  const deposito = page.getByLabel(/Depósito/i);

  await expect(deposito).toBeVisible();

  await deposito.fill('1000');

  // =====================================================
  // 10. DÍAS PARA EL VENCIMIENTO
  // =====================================================

  const diasVencimiento =
    page.getByLabel(/Días para el vencimiento/i);

  await expect(diasVencimiento).toBeVisible();

  await diasVencimiento.fill('5');

  // =====================================================
  // 11. CREAR CONTRATO
  // =====================================================

  await page
    .getByRole('button', {
      name: 'Crear contrato',
      exact: true
    })
    .click();

  // =====================================================
  // 12. VERIFICAR CREACIÓN
  // =====================================================

  await expect(
    page.getByRole('heading', { name: 'Contratos' })
  ).toBeVisible();

  // Verificar que el formulario se cerró
  await expect(
    page.getByRole('button', {
      name: 'Crear contrato',
      exact: true
    })
  ).not.toBeVisible();
});
