# Somos Igera · landing Fase 1

Landing con inscripción a la jornada de salones y calculadora de costos. Node 18+, sin dependencias.

## Variables en Railway
- `ADMIN_TOKEN`: clave larga y secreta para ver el panel de inscriptos.
- `DATA_DIR=/data`: carpeta donde se guardan las inscripciones.

Montar un **Volume** en `/data`. Sin el Volume, las inscripciones se borran en cada deploy.

## Rutas
- `/`: landing pública
- `/admin?token=ADMIN_TOKEN`: inscriptos
- `/admin.csv?token=ADMIN_TOKEN`: descarga en CSV
- `/health`: chequeo de salud

## Pendiente antes de abrir al público
Logo, colores, número de WhatsApp, fecha y sede oficiales. Ver el Roadmap MVP Somos Igera.
