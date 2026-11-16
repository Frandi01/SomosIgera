// Conexión a Postgres y esquema. Las tablas se crean solas en el primer uso.
import "server-only";
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const g = globalThis;
if (!g.__igeraPool) {
  const url = process.env.DATABASE_URL || "";
  g.__igeraPool = new Pool({
    connectionString: url,
    max: 5,
    ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined,
  });
}
const pool = g.__igeraPool;

const SCHEMA = `
create table if not exists usuarios (
  id serial primary key,
  email text unique not null,
  nombre text not null,
  password_hash text not null,
  rol text not null default 'alumno' check (rol in ('admin','equipo','alumno')),
  creado timestamptz not null default now()
);
create table if not exists sesiones (
  token_hash text primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  vence timestamptz not null
);
create table if not exists restablecer (
  token_hash text primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  vence timestamptz not null
);
create table if not exists inscripciones (
  id serial primary key,
  fecha timestamptz not null default now(),
  nombre text not null, whatsapp text not null, email text not null,
  negocio text, rubro text, rol text, asistentes int not null default 1,
  charla text, origen text, fuente text,
  calculadora jsonb
);
create table if not exists cursos (
  id serial primary key,
  slug text unique not null,
  titulo text not null,
  descripcion text not null default '',
  gratuito boolean not null default true,
  publicado boolean not null default false,
  creado timestamptz not null default now()
);
create table if not exists lecciones (
  id serial primary key,
  curso_id int not null references cursos(id) on delete cascade,
  orden int not null default 1,
  titulo text not null,
  descripcion text not null default '',
  youtube_id text,
  material_url text,
  minutos int
);
create table if not exists progreso (
  usuario_id int not null references usuarios(id) on delete cascade,
  leccion_id int not null references lecciones(id) on delete cascade,
  completado timestamptz not null default now(),
  primary key (usuario_id, leccion_id)
);
create index if not exists lecciones_curso on lecciones(curso_id, orden);
alter table usuarios add column if not exists activo boolean not null default true;
alter table usuarios add column if not exists ultimo_ingreso timestamptz;
create table if not exists ajustes (
  clave text primary key,
  valor text not null,
  actualizado timestamptz not null default now()
);
`;

let ready = g.__igeraReady;
async function init() {
  await pool.query(SCHEMA);
  await importarInscripcionesViejas();
}
// Inscripciones guardadas por la versión anterior en el volumen (/data/inscripciones.jsonl).
async function importarInscripcionesViejas() {
  const file = path.join(process.env.DATA_DIR || "/data", "inscripciones.jsonl");
  if (!fs.existsSync(file)) return;
  const { rows } = await pool.query("select count(*)::int n from inscripciones");
  if (rows[0].n > 0) return;
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  for (const l of lines) {
    let r; try { r = JSON.parse(l); } catch { continue; }
    await pool.query(
      `insert into inscripciones (fecha,nombre,whatsapp,email,negocio,rubro,rol,asistentes,charla,origen,fuente,calculadora)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [r.fecha, r.nombre, r.whatsapp, r.email, r.negocio, r.rubro, r.rol, r.asistentes || 1, r.charla, r.origen, r.fuente || "directo", r.calculadora || null]
    );
  }
  fs.renameSync(file, file + ".importado");
  console.log(`Importadas ${lines.length} inscripciones del volumen`);
}

export async function q(text, params) {
  if (!ready) ready = g.__igeraReady = init().catch(e => { g.__igeraReady = null; ready = null; throw e; });
  await ready;
  return pool.query(text, params);
}
