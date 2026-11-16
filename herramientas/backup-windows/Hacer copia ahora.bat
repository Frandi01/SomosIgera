@echo off
echo Haciendo la copia de seguridad de Igera...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\Igera\backup-igera.ps1"
if errorlevel 1 (echo La copia fallo: mira el archivo "ULTIMA COPIA FALLO.txt" en Documentos\Backups Igera) else (echo Listo. La copia esta en Documentos\Backups Igera)
pause
