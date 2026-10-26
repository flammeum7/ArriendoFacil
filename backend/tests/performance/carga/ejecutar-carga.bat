@echo off
REM ================================================================
REM  Ejecuta las 4 pruebas de CARGA en secuencia (una tras otra, sin
REM  mezclarse) y guarda un reporte HTML + un resumen JSON por cada una.
REM
REM  Requisitos:
REM    - Backend de pruebas corriendo en otra terminal:
REM        npx dotenv -e .env.test -v DISABLE_RATE_LIMIT=true -- node src/server.js
REM    - Ejecutar desde la carpeta backend:
REM        tests\performance\carga\ejecutar-carga.bat
REM
REM  Resultado: tests\performance\reportes\carga\
REM ================================================================

set DIR=tests\performance
set OUT=%DIR%\reportes\carga
if not exist "%OUT%" mkdir "%OUT%"
set K6_WEB_DASHBOARD=true

echo.
echo [0/5] Reiniciando la base de pruebas a un estado conocido (npm test)...
call npm test
if errorlevel 1 (
  echo.
  echo npm test fallo. Revisa el error antes de ejecutar las pruebas de rendimiento.
  exit /b 1
)

echo.
echo [1/5] Sprint 1 - Login + listado de arrendatarios...
set K6_WEB_DASHBOARD_EXPORT=%OUT%\reporte-sprint1.html
k6 run --summary-export=%OUT%\sprint1.json %DIR%\carga\sprint1-rendimiento.js

echo.
echo [2/5] Sprint 2 - Registro + listado de contratos...
set K6_WEB_DASHBOARD_EXPORT=%OUT%\reporte-sprint2.html
k6 run --summary-export=%OUT%\sprint2.json %DIR%\carga\sprint2-rendimiento.js

echo.
echo [3/5] Sprint 3 - Subida + consulta de documentos...
set K6_WEB_DASHBOARD_EXPORT=%OUT%\reporte-sprint3.html
k6 run --summary-export=%OUT%\sprint3.json %DIR%\carga\sprint3-rendimiento.js

echo.
echo [4/5] Preparando 50 pagos pendientes para el sprint 4...
call npx dotenv -e .env.test -- node %DIR%\datos\preparar-sprint4.js
if errorlevel 1 (
  echo No se pudieron preparar los pagos. Se omite el sprint 4.
  goto fin
)

echo.
echo [5/5] Sprint 4 - Flujo de pago + servicios + consultas...
set K6_WEB_DASHBOARD_EXPORT=%OUT%\reporte-sprint4.html
k6 run --summary-export=%OUT%\sprint4.json %DIR%\carga\sprint4-rendimiento.js

:fin
set K6_WEB_DASHBOARD=
set K6_WEB_DASHBOARD_EXPORT=
echo.
echo Listo. Reportes guardados en %OUT%
dir /b "%OUT%"
