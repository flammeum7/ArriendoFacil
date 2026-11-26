# Pruebas móviles y responsive – Arriendo Fácil (Sección 14.1, APF3)

Pruebas automatizadas con **Playwright** sobre la web hosteada, ejecutadas en 5 dispositivos
(PC Chrome, PC Safari, Pixel 7, iPhone 13 e iPad).

## Patrones aplicados
- **Page Object Model**: una clase por pantalla en `pages/` (las internas heredan de `AppLayoutPage`).
- **AAA (Arrange–Act–Assert)** en cada prueba.
- **Ejecución parametrizada por dispositivo** con `projects` en `playwright.config.js`.
- **Configuración externa** (`.env`) y **aserciones suaves** (`expect.soft`) para criterios responsive.
- **Sesión reutilizable**: `tests/auth.setup.js` inicia sesión una vez por rol (límite de 20 logins / 15 min).

## Casos
| Caso | Archivo | Rol |
|---|---|---|
| CP-MOV-01 Inicio de sesión (válido / inválido) | `cp-mov-01-login.spec.js` | arrendador |
| CP-MOV-02 Menú de navegación (hamburguesa) | `cp-mov-02-menu.spec.js` | arrendador |
| CP-MOV-03 Listado de contratos (tabla) | `cp-mov-03-listado-contratos.spec.js` | arrendador |
| CP-MOV-04 Registrar contrato + fechas (INC-03) | `cp-mov-04-registrar-contrato.spec.js` | arrendador |
| CP-MOV-05 Subir comprobante de pago | `cp-mov-05-subir-comprobante.spec.js` | arrendatario |
| CP-MOV-06 Aprobar / rechazar pago | `cp-mov-06-aprobar-rechazar-pago.spec.js` | arrendador |
| CP-MOV-07 Abrir documento PDF | `cp-mov-07-ver-documento.spec.js` | arrendador |
| CP-MOV-08 Orientación horizontal (solo móvil/tablet) | `cp-mov-08-orientacion.spec.js` | arrendador |

Cada caso verifica 3 dimensiones:
- **Compatibilidad**: sin errores de consola ni excepciones JS (`vigilarConsola`).
- **Interacción**: tamaño táctil ≥ 44 px y `type` del input (teclado correcto).
- **Diseño adaptable**: sin scroll horizontal y elementos dentro del ancho de pantalla.

Los **hallazgos** que no son fallos (p. ej. accesibilidad de etiquetas) se anotan en el reporte
HTML como anotación `hallazgo`.

## Escritura de datos
Por defecto (`PERMITIR_ESCRITURA=false`) los casos llenan formularios y abren modales, pero
**cancelan sin guardar**. Con `PERMITIR_ESCRITURA=true`:
- CP-MOV-04 crea un contrato y verifica INC-03 en el listado.
- CP-MOV-05 sube el comprobante.
- CP-MOV-06 acepta la aprobación del pago.

## Estructura
```
pages/       Page Objects (LoginPage, AppLayoutPage, ContratosPage, PagosPage, DocumentosPage)
utils/       entorno.js (variables .env) y responsive.js (verificaciones y evidencias)
tests/       auth.setup.js + casos CP-MOV-XX
evidencias/  Capturas generadas (CP-MOV-XX_dispositivo_momento.png)
```

## Cómo ejecutar
```bash
npm install
npx playwright install
cp .env.example .env        # y completar credenciales de prueba
npm test                    # 5 dispositivos
npm run test:pixel          # solo Pixel 7
npm run test:movil          # Pixel 7, iPhone 13 e iPad
npx playwright test --project="D-03 Pixel 7" --headed   # viendo el navegador
npm run reporte             # reporte HTML
```
