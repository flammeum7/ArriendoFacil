import { test, expect } from '@playwright/test';
import { ContratosPage } from '../pages/ContratosPage.js';
import { ESTADO_SESION, PERMITIR_ESCRITURA } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarDentroDelAncho,
  verificarTamanoTactil,
  verificarTipoTeclado,
  capturarEvidencia,
} from '../utils/responsive.js';

test.use({ storageState: ESTADO_SESION.arrendador });

/** Primer día del mes siguiente y un año después, en formato AAAA-MM-DD */
function fechasDePrueba() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const fin = new Date(inicio.getFullYear() + 1, inicio.getMonth(), 1);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { inicio: iso(inicio), vencimiento: iso(fin) };
}

test.describe('CP-MOV-04 Registrar contrato con selector de fechas', () => {
  test('CP-MOV-04 El formulario se adapta, usa teclados correctos y muestra bien las fechas (INC-03)', async ({ page }, testInfo) => {
    // Arrange
    const errores = vigilarConsola(page);
    const contratos = new ContratosPage(page);
    const fechas = fechasDePrueba();
    await contratos.abrir();

    // Act – abrir el modal "Nuevo contrato"
    await contratos.abrirModalNuevo();

    // Assert – diseño adaptable del modal
    await verificarDentroDelAncho(page, contratos.modalNuevo, 'Modal Nuevo contrato');
    await verificarSinScrollHorizontal(page, 'con el modal abierto');

    // Assert – interacción: el tipo de cada campo define el teclado / selector en móvil
    await verificarTipoTeclado(contratos.fechaInicio, 'date', 'Fecha de inicio');
    await verificarTipoTeclado(contratos.fechaVencimiento, 'date', 'Fecha de vencimiento');
    await verificarTipoTeclado(contratos.alquiler, 'number', 'Alquiler mensual');
    await verificarTipoTeclado(contratos.deposito, 'number', 'Depósito');
    await verificarTipoTeclado(contratos.diasVencimientoPago, 'number', 'Días para el vencimiento');
    await verificarTamanoTactil(contratos.fechaInicio, 'Selector Fecha de inicio');
    await verificarTamanoTactil(contratos.botonCrear, 'Botón Crear contrato');

    // Act – llenar el formulario
    const elegido = await contratos.llenarFormulario(fechas);

    // Assert – el selector de fecha conserva exactamente la fecha elegida
    await expect(contratos.fechaInicio).toHaveValue(fechas.inicio);
    await expect(contratos.fechaVencimiento).toHaveValue(fechas.vencimiento);
    await contratos.botonCrear.scrollIntoViewIfNeeded();
    await expect(contratos.botonCrear, 'Botón Crear alcanzable dentro del modal').toBeInViewport();
    await capturarEvidencia(page, testInfo, 'CP-MOV-04', 'formulario');

    if (!PERMITIR_ESCRITURA) {
      // Modo seguro: no se guarda nada en la web hosteada
      testInfo.annotations.push({
        type: 'modo',
        description: 'PERMITIR_ESCRITURA=false: se canceló sin guardar; INC-03 no se verificó en el listado',
      });
      await contratos.cancelarModal();
      verificarSinErroresConsola(errores);
      return;
    }

    test.skip(!elegido.arrendatario || !elegido.propiedad,
      'No hay arrendatarios activos o propiedades disponibles para crear el contrato');

    // Act – guardar el contrato
    await contratos.guardarContrato();

    // Assert – INC-03: la fecha mostrada debe ser la misma que se eligió
    const fila = contratos.filas(elegido.propiedad).first();
    await expect(fila).toBeVisible();
    const inicioEsperado = await contratos.fechaEsperadaEnPantalla(fechas.inicio);
    const vencimientoEsperado = await contratos.fechaEsperadaEnPantalla(fechas.vencimiento);
    await expect.soft(fila, `INC-03: inicio ${fechas.inicio} debe verse como ${inicioEsperado}`)
      .toContainText(inicioEsperado);
    await expect.soft(fila, `INC-03: vencimiento ${fechas.vencimiento} debe verse como ${vencimientoEsperado}`)
      .toContainText(vencimientoEsperado);
    await verificarSinScrollHorizontal(page, 'tras crear el contrato');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-04', 'contrato-creado');
  });
});
