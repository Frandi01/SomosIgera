# Copia de seguridad de Igera: baja la base completa del panel y la guarda en esta PC.
# La corre sola la tarea programada "Igera - Copia de seguridad" (una vez por semana).
# Guarda las ultimas 8 copias en Documentos\Backups Igera y deja un registro en backup.log.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"   # sin esto, PowerShell 5 baja archivos grandes muy lento
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$configDir = Join-Path $env:LOCALAPPDATA "Igera"
$config = Get-Content (Join-Path $configDir "backup.json") -Raw | ConvertFrom-Json
$destino = $config.carpeta
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$log = Join-Path $destino "backup.log"
$alerta = Join-Path $destino "ULTIMA COPIA FALLO.txt"

function Registrar($texto) {
  Add-Content -Path $log -Value ("{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm"), $texto) -Encoding UTF8
}

$fecha = Get-Date -Format "yyyy-MM-dd"
$final = Join-Path $destino "igera-backup-$fecha.ndjson.gz"
$temporal = "$final.descargando"

try {
  Invoke-WebRequest -Uri ("{0}/api/backup" -f $config.url) -Headers @{ "x-backup-secret" = $config.secreto } `
    -OutFile $temporal -TimeoutSec 1800 -UseBasicParsing

  # Se verifica que el archivo este completo: tiene que terminar con la marca {"fin":true}.
  $ultima = $null; $filas = 0
  $fs = [IO.File]::OpenRead($temporal)
  try {
    $gz = New-Object IO.Compression.GZipStream($fs, [IO.Compression.CompressionMode]::Decompress)
    $sr = New-Object IO.StreamReader($gz, [Text.Encoding]::UTF8)
    while (($linea = $sr.ReadLine()) -ne $null) { if ($linea) { $ultima = $linea; $filas++ } }
    $sr.Close()
  } finally { $fs.Close() }
  if ($ultima -ne '{"fin":true}') { throw "La copia llego cortada (no termina con la marca de fin)." }

  Move-Item -Force $temporal $final
  $mb = [math]::Round((Get-Item $final).Length / 1MB, 1)
  Registrar ("OK  {0}  ({1} MB, {2} filas)" -f (Split-Path $final -Leaf), $mb, ($filas - 2))
  if (Test-Path $alerta) { Remove-Item $alerta -Force }

  # Se guardan las ultimas 8 copias; las mas viejas se borran.
  Get-ChildItem $destino -Filter "igera-backup-*.ndjson.gz" | Sort-Object Name -Descending |
    Select-Object -Skip 8 | Remove-Item -Force
}
catch {
  if (Test-Path $temporal) { Remove-Item $temporal -Force }
  $msg = $_.Exception.Message
  Registrar "FALLO  $msg"
  Set-Content -Path $alerta -Encoding UTF8 -Value @"
La copia de seguridad de Igera del $fecha no se pudo hacer.

Motivo: $msg

Que revisar:
- Que la PC tenga internet.
- Que en Railway (servicio web del proyecto somos-igera, Variables) siga cargada BACKUP_SECRET con el mismo valor
  que se mostro al instalar.
Para reintentar: doble clic en "Hacer copia ahora" (carpeta herramientas\backup-windows del repo SomosIgera).
"@
  exit 1
}
