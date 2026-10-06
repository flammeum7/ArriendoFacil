import { test, expect } from '@playwright/test';

test('CF-01 - Registrar arrendatario y verificar listado', async ({ page }) => {
  // =====================================================
  // 1. INICIAR SESIÓN
  // =====================================================

  await page.goto('/');

  // Verificar pantalla de inicio de sesión
  await expect(
    page.getByText('ArriendoFácil')
  ).toBeVisible();

  await expect(
    page.getByText('Iniciar sesión')
  ).toBeVisible();

  // Ingresar credenciales del arrendador
  await page
    .getByLabel('Correo electrónico')
    .fill('admin@arriendofacil.com');

  await page
    .getByLabel('Contraseña')
    .fill('Admin2026');

  // Ingresar al sistema
  await page
    .getByRole('button', { name: 'Ingresar' })
    .click();

  // Verificar que ingresamos al panel
  await expect(
    page.getByRole('heading', { name: 'Resumen' })
  ).toBeVisible();

  // =====================================================
  // 2. IR A ARRENDATARIOS
  // =====================================================

  await page
    .getByRole('link', { name: 'Arrendatarios' })
    .click();

  // Verificar que estamos en la sección Arrendatarios
  await expect(
    page.getByRole('heading', { name: 'Arrendatarios' })
  ).toBeVisible();

  // =====================================================
  // 3. ABRIR FORMULARIO DE NUEVO ARRENDATARIO
  // =====================================================

  await page
    .getByRole('button', { name: /Nuevo arrendatario/i })
    .click();

  // Verificar que aparece el formulario
  await expect(
    page.getByText('Nombre completo', { exact: true })
  ).toBeVisible();

  // =====================================================
  // 4. COMPLETAR FORMULARIO
  // =====================================================

  const nombre = 'Prueba Playwright';
  const dni = '87654321';
  const correo = `playwright.${Date.now()}@test.com`;
  const telefono = '987654321';

  await page
    .getByLabel('Nombre completo')
    .fill(nombre);

  await page
    .getByLabel('DNI')
    .fill(dni);

  await page
    .getByLabel('Correo electrónico')
    .fill(correo);

  await page
    .getByLabel('Teléfono')
    .fill(telefono);

  // =====================================================
  // 5. GUARDAR
  // =====================================================

  await page
    .getByRole('button', { name: 'Guardar', exact: true })
    .click();

  // =====================================================
  // 6. VERIFICAR QUE EL ARRENDATARIO FUE REGISTRADO
  // =====================================================

  await expect(
    page.getByText(nombre, { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText(dni, { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText(correo, { exact: true })
  ).toBeVisible();
});