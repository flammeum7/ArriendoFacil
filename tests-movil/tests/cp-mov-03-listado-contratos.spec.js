import { test, expect } from '@playwright/test';
import { ContratosPage } from '../pages/ContratosPage.js';
import { ESTADO_SESION } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarDentroDelAncho,
  verificarTamanoTactil,
  capturarEvidencia,
} from '../utils/responsive.js';

test.use({ storageState: ESTADO_SESION.arrendador });

test.describe('CP-MOV-03 Listado de contratos', () => {
  test('CP-MOV-03 La tabla de contratos no corta columnas ni desborda la página', async ({ page }, testInfo) => {
    // Arrange
    const errores = vigilarConsola(page);
    const contratos = new ContratosPage(page);

    // Act
    await contratos.abrir();

    // Assert – diseño adaptable: la PÁGINA no tiene scroll horizontal
    await verificarSinScrollHorizontal(page, 'en /contracts');
    await verificarDentroDelAncho(page, contratos.contenedorTabla(), 'Contenedor de la tabla');
    await expect(contratos.tabla.getByRole('columnheader', { name: 'Arrendatario' })).toBeVisible();

    // Assert – la tabla se desplaza DENTRO de su contenedor (comportamiento esperado en móvil)
    const medida = await contratos.medirScrollTabla();
    testInfo.annotations.push({
      type: 'medida',
      description: `Tabla ${medida.anchoTabla}px en contenedor de ${medida.anchoVisible}px → ` +
        (medida.tieneScrollInterno ? 'scroll horizontal interno' : 'cabe completa'),
    });
    await capturarEvidencia(page, testInfo, 'CP-MOV-03', 'inicio-tabla');

    // Act – deslizar la tabla hasta la última columna
    await contratos.desplazarTablaAlFinal();

    // Assert – la columna "Estado" se alcanza y la página sigue sin desbordarse
    await expect(contratos.tabla.getByRole('columnheader', { name: 'Estado' })).toBeInViewport();
    await verificarSinScrollHorizontal(page, 'tras desplazar la tabla');
    await capturarEvidencia(page, testInfo, 'CP-MOV-03', 'final-tabla');

    // Assert – interacción: controles táctiles
    await verificarTamanoTactil(contratos.botonNuevo, 'Botón + Nuevo contrato');
    await verificarTamanoTactil(contratos.filtroEstado(), 'Filtro de estado');

    // Act – filtrar por "Vigente"
    await contratos.filtroEstado().selectOption({ label: 'Vigente' });

    // Assert – la tabla se vuelve a mostrar sin errores
    await contratos.esperarTabla();
    await verificarSinScrollHorizontal(page, 'con filtro Vigente');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-03', 'filtro-vigente');
  });
});
