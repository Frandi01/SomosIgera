# Somos Igera · web

Next.js 14 + Postgres. Landing con inscripción a la jornada y calculadora, cuentas con roles y cursos gratuitos.

## Variables en Railway (servicio `web`)
- `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
- `ADMIN_EMAILS`: mails separados por coma que quedan como admin al registrarse o ingresar.
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

## Local
```
DATABASE_URL=postgres://... ADMIN_EMAILS=vos@mail.com npm run dev
```

## Pendiente
Logo, colores y WhatsApp oficiales. Mail automático para confirmar inscripción y recuperar contraseña (hoy el admin genera el link desde el panel).
