# Somos Igera · web

Next.js 14 + Postgres. Landing con inscripción a la jornada y calculadora, cuentas con roles y cursos gratuitos.

## Variables en Railway (servicio `web`)
- `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
- `ADMIN_EMAILS`: mails separados por coma que quedan como admin al registrarse o ingresar.
- `BACKUP_SECRET`: lo genera la herramienta de backup al instalarse (32+ caracteres).
- `DATA_DIR=/data`: volumen de la versión anterior. Las inscripciones de `inscripciones.jsonl` se importan solas a Postgres la primera vez.

## Roles
- **admin**: todo, incluido cambiar roles y generar links para cambiar contraseña.
- **equipo**: ve inscriptos, descarga el CSV y carga cursos.
- **alumno**: ve cursos publicados y guarda su avance.

## Rutas
- `/`: landing (HTML estático en `content/landing.html`)
- `/cursos`, `/cursos/[slug]`: catálogo y curso (los videos son de YouTube no listado)
- `/registro`, `/ingresar`, `/cuenta`, `/restablecer/[token]`
- `/panel`, `/panel/cursos`, `/panel/usuarios`, `/panel/csv`
- `/api/inscripciones`, `/api/stats`, `/jornada.ics`, `/og.png`, `/health`

## Deploy y estabilidad
- Arranque: `node node_modules/next/dist/bin/next start` (sin npm) con `NEXT_MANUAL_SIG_HANDLE=true`: el apagado lo maneja `lib/apagado.js` y sale con 0, así Railway no lo marca como caída.
- La base tolera cortes: el pool de Postgres escucha `error` y reabre la conexión en el próximo pedido.
- Sin volumen montado: los deploys se superponen 10 s y no hay corte. Política de reinicio: ON_FAILURE, 10 intentos.

## Deploy
Cada push a `main` se despliega solo en Railway (servicio `web`, proyecto `somos-igera`).

## Local
```
DATABASE_URL=postgres://... ADMIN_EMAILS=vos@mail.com npm run dev
```

## Copia de seguridad
Igual que DAIA: `herramientas/backup-windows` instala en la PC una copia semanal (domingos 13:30) que baja `/api/backup` con el header `x-backup-secret` = `BACKUP_SECRET`. Restaurar: `node scripts/restaurar-backup.mjs <copia>.ndjson.gz "<DATABASE_URL>"`.

## Pendiente
Logo, colores y WhatsApp oficiales. Mail automático para confirmar inscripción y recuperar contraseña (hoy el admin genera el link desde el panel).
