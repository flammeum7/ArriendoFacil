# Registra cada 30 s la memoria y CPU del backend (proceso node que escucha en el puerto 3001)
# mientras corre la prueba de resistencia. Detener con Ctrl + C.
#
# Uso (en una TERCERA terminal, desde la carpeta backend):
#   powershell -ExecutionPolicy Bypass -File tests/performance/monitor-memoria.ps1
# Resultado: tests/performance/reportes/memoria-resistencia.csv

param(
  [int]$Puerto = 3001,
  [int]$Intervalo = 30,
  [string]$Salida = "tests/performance/reportes/memoria-resistencia.csv"
)

$conexion = Get-NetTCPConnection -LocalPort $Puerto -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $conexion) {
  Write-Error "No hay ningun proceso escuchando en el puerto $Puerto. Arranca primero el backend."
  exit 1
}
$procesoId = $conexion.OwningProcess

New-Item -ItemType Directory -Force -Path (Split-Path $Salida) | Out-Null
"hora,minuto,memoria_mb,cpu_segundos" | Out-File -FilePath $Salida -Encoding utf8

$inicio = Get-Date
Write-Host "Monitoreando el proceso $procesoId (puerto $Puerto) cada $Intervalo s. Ctrl + C para detener."

while ($true) {
  $p = Get-Process -Id $procesoId -ErrorAction SilentlyContinue
  if (-not $p) { Write-Host "El proceso termino."; break }
  $minuto = [math]::Round(((Get-Date) - $inicio).TotalMinutes, 1)
  $memoria = [math]::Round($p.WorkingSet64 / 1MB, 1)
  $cpu = [math]::Round($p.CPU, 1)
  "$(Get-Date -Format HH:mm:ss),$minuto,$memoria,$cpu" | Out-File -FilePath $Salida -Append -Encoding utf8
  Write-Host "min $minuto  ->  memoria: $memoria MB   CPU acumulada: $cpu s"
  Start-Sleep -Seconds $Intervalo
}
