# Instala la copia de seguridad semanal de Igera en esta PC. Se corre una sola vez.
$ErrorActionPreference = "Stop"

$configDir = Join-Path $env:LOCALAPPDATA "Igera"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null
$configFile = Join-Path $configDir "backup.json"
$carpeta = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Backups Igera"
New-Item -ItemType Directory -Force -Path $carpeta | Out-Null

# 1. La clave que comparte esta PC con el panel. Si ya habia una, se reutiliza.
$secreto = $null
if (Test-Path $configFile) { $secreto = (Get-Content $configFile -Raw | ConvertFrom-Json).secreto }
$nueva = -not $secreto
if ($nueva) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secreto = -join ($bytes | ForEach-Object { $_.ToString("x2") })
}
@{ url = "https://web-production-326e2867.up.railway.app"; secreto = $secreto; carpeta = $carpeta } |
  ConvertTo-Json | Set-Content -Path $configFile -Encoding UTF8

# 2. El script de copia queda en una carpeta propia, para no depender de esta.
Copy-Item -Force (Join-Path $PSScriptRoot "backup-igera.ps1") (Join-Path $configDir "backup-igera.ps1")
$script = Join-Path $configDir "backup-igera.ps1"

# 3. La tarea programada: domingos 13:30. Si la PC estaba apagada, corre apenas se prende.
$accion = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$cuando = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 13:30
$opciones = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1) -RunOnlyIfNetworkAvailable
Register-ScheduledTask -TaskName "Igera - Copia de seguridad" -Action $accion -Trigger $cuando `
  -Settings $opciones -Description "Baja la base de Igera y la guarda en Documentos\Backups Igera" -Force | Out-Null

Write-Host ""
Write-Host "Listo: la copia queda programada para todos los domingos a las 13:30." -ForegroundColor Green
Write-Host "Se guarda en: $carpeta"
Write-Host ""
if ($nueva) {
  Set-Clipboard -Value $secreto
  Write-Host "FALTA UN PASO (una sola vez):" -ForegroundColor Yellow
  Write-Host "  1. Entra a Railway > servicio web (proyecto somos-igera) > Variables > New Variable."
  Write-Host "  2. Nombre: BACKUP_SECRET"
  Write-Host "  3. Valor: pega con Ctrl+V (ya esta copiado)."
  Write-Host "  4. Guarda y espera que Railway termine de publicar (unos 4 minutos)."
  Write-Host ""
  Read-Host "Cuando Railway haya terminado, apreta Enter para hacer la primera copia de prueba"
}

Write-Host "Haciendo la primera copia..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script
if ($LASTEXITCODE -eq 0) {
  Write-Host "La copia de prueba salio bien. Esta en $carpeta" -ForegroundColor Green
  Start-Process explorer.exe $carpeta
} else {
  Write-Host "La copia de prueba fallo. Mira el archivo 'ULTIMA COPIA FALLO.txt' en $carpeta" -ForegroundColor Red
}
Read-Host "Apreta Enter para cerrar"
