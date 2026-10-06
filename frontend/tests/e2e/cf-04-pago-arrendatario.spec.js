import { test, expect } from '@playwright/test';

test('CF-04 - Flujo de pago: arrendatario sube comprobante y arrendador lo aprueba', async ({ page }) => {
// Datos de prueba
const correoArrendatario = ['hc', 'gmail.com'].join('@');
const contrasenaArrendatario = '12345678';
const correoArrendador = 'admin@arriendofacil.com';
const contrasenaArrendador = 'Admin2026';

// =====================================================
// PARTE 1: ARRENDATARIO SUBE EL COMPROBANTE
// =====================================================

// 1. Ingresar como arrendatario
await page.goto('/');

await expect(
page.getByText('ArriendoFácil')
).toBeVisible();

const campoCorreo = page.getByLabel('Correo electrónico');
const campoContrasena = page.getByLabel('Contraseña');

await campoCorreo.fill(correoArrendatario);
await campoContrasena.fill(contrasenaArrendatario);

await expect(campoCorreo).toHaveValue(correoArrendatario);

await page
.getByRole('button', { name: 'Ingresar' })
.click();

// 2. Verificar dashboard
await expect(
page.getByRole('heading', { name: 'Resumen' })
).toBeVisible({ timeout: 10000 });

// 3. Ir a Mis pagos
await page
.getByRole('link', { name: 'Mis pagos' })
.click();

await expect(
page.getByRole('heading', { name: 'Pagos' })
).toBeVisible();

await expect(
page.getByText('Tus pagos de alquiler')
).toBeVisible();

// 4. Localizar pago #5
const filaPago = page
.locator('tr')
.filter({ hasText: '#5' });

await expect(filaPago).toBeVisible();

await expect(
filaPago.getByText('S/ 1,600.00', { exact: false })
).toBeVisible();

await expect(
filaPago.getByText('Vencido', { exact: true })
).toBeVisible();

// 5. Abrir formulario para subir comprobante
await filaPago
.getByRole('button', {
name: 'Subir comprobante',
exact: true
})
.click();

// 6. Verificar campo de archivo
await expect(
page.getByText(
'Archivo (PDF, JPG o PNG · máx 5 MB)',
{ exact: true }
)
).toBeVisible();

const archivo = page.locator('input[type="file"]');

await expect(archivo).toBeVisible();

// 7. Localizar el selector de método de pago
const metodoPago = page
.locator('select')
.filter({
has: page.locator('option', { hasText: 'Transferencia' })
});

await expect(metodoPago).toHaveCount(1);
await expect(metodoPago).toBeVisible();

// 8. Verificar opciones del método de pago
await expect(metodoPago.locator('option')).toHaveCount(6);
await expect(metodoPago.locator('option').nth(0)).toHaveText('Selecciona (opcional)');
await expect(metodoPago.locator('option').nth(1)).toHaveText('Transferencia');
await expect(metodoPago.locator('option').nth(2)).toHaveText('Yape');
await expect(metodoPago.locator('option').nth(3)).toHaveText('Plin');
await expect(metodoPago.locator('option').nth(4)).toHaveText('Depósito');
await expect(metodoPago.locator('option').nth(5)).toHaveText('Efectivo');

// 9. Seleccionar Yape
await metodoPago.selectOption({ label: 'Yape' });

// 10. Cargar comprobante
await archivo.setInputFiles('tests/e2e/comprobante-prueba.pdf');

// 11. Verificar botones
await expect(
page.getByRole('button', { name: 'Cancelar', exact: true })
).toBeVisible();

await expect(
page.getByRole('button', { name: 'Subir', exact: true })
).toBeVisible();

// 12. Confirmar subida
await page
.getByRole('button', { name: 'Subir', exact: true })
.click();

// 13. Verificar que el formulario desaparezca
await expect(
page.getByText(
'Archivo (PDF, JPG o PNG · máx 5 MB)',
{ exact: true }
)
).not.toBeVisible();

// 14. Verificar que el pago pase a "Por validar"
await expect(
filaPago.getByText('Por validar', { exact: true })
).toBeVisible();

// =====================================================
// PARTE 2: ARRENDADOR VALIDA Y APRUEBA EL PAGO
// =====================================================

// 15. Cerrar sesión del arrendatario
await page
.getByRole('button', { name: 'Salir', exact: true })
.click();

await expect(page).toHaveURL(/\/login/);

// 16. Ingresar como arrendador
await page
.getByLabel('Correo electrónico')
.fill(correoArrendador);

await page
.getByLabel('Contraseña')
.fill(contrasenaArrendador);

await page
.getByRole('button', { name: 'Ingresar' })
.click();

await expect(
page.getByRole('heading', { name: 'Resumen' })
).toBeVisible({ timeout: 10000 });

// 17. Ir a Pagos
await page
.getByRole('link', { name: 'Pagos', exact: true })
.click();

await expect(
page.getByText('Gestión de pagos y comprobantes')
).toBeVisible();

// 18. Localizar el pago #5 en la vista del arrendador
const filaPagoArrendador = page
.locator('tr')
.filter({ hasText: '#5' });

await expect(
filaPagoArrendador.getByText('Por validar', { exact: true })
).toBeVisible();

// 19. Verificar que el comprobante está adjunto
await expect(
filaPagoArrendador.getByRole('button', { name: 'Ver', exact: true })
).toBeVisible();

// 20. Aprobar el pago (acepta el confirm del navegador)
page.once('dialog', (dialog) => dialog.accept());

await filaPagoArrendador
.getByRole('button', { name: 'Aprobar', exact: true })
.click();

// 21. Verificar que el pago pase a "Pagado"
await expect(
filaPagoArrendador.getByText('Pagado', { exact: true })
).toBeVisible();

// 22. Verificar que ya no se puede aprobar
await expect(
filaPagoArrendador.getByRole('button', { name: 'Aprobar', exact: true })
).toHaveCount(0);
});