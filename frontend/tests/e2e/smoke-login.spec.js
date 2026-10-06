import { test, expect } from '@playwright/test';

test('Smoke - Login del arrendador', async ({ page }) => {
  // Abrir la aplicación
  await page.goto('/');

  // Verificar que se muestra la pantalla de inicio de sesión
  await expect(
    page.getByText('ArriendoFácil')
  ).toBeVisible();

  await expect(
    page.getByText('Iniciar sesión')
  ).toBeVisible();

  await expect(
    page.getByText('Sistema de gestión de alquileres')
  ).toBeVisible();

  // Completar correo electrónico
  await page
    .getByLabel('Correo electrónico')
    .fill('admin@arriendofacil.com');

  // Completar contraseña
  await page
    .getByLabel('Contraseña')
    .fill('Admin2026');

  // Hacer clic en Ingresar
  await page
    .getByRole('button', { name: 'Ingresar' })
    .click();

  // Verificar que el usuario salió de la pantalla de login
  await expect(page).not.toHaveURL(/login/i);
});