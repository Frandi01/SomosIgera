// Copia de seguridad completa de la base, para que la PC del dueño la baje una vez por semana
// (herramientas/backup-windows). Mismo formato y mismas reglas que DAIA:
// - Solo responde con el header x-backup-secret igual a BACKUP_SECRET (32+ caracteres). Sin esa
//   variable, la ruta no existe (404).
// - Sale cada tabla del esquema public, fila por fila, como la serializa Postgres (row_to_json),
//   una línea JSON por fila ({"t":tabla,"f":fila}), con gzip y armada a medida que se manda.
// - Termina con {"fin":true}: la PC verifica esa marca para saber que la copia llegó entera.
import { createGzip } from "node:zlib";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { q } from "@/lib/db";
import { guardarAjuste } from "@/lib/ajustes";

export const dynamic = "force-dynamic";
const TANDA = 200;

function autorizado(req) {
  const secreto = process.env.BACKUP_SECRET?.trim();
  const recibido = req.headers.get("x-backup-secret")?.trim();
  if (!secreto || secreto.length < 32 || !recibido) return false;
  const a = Buffer.from(secreto), b = Buffer.from(recibido);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function* lineas() {
  const { rows: tablas } = await q(
    `select table_name as tabla from information_schema.tables
     where table_schema='public' and table_type='BASE TABLE' order by table_name`);
  yield JSON.stringify({ meta: { exportadoEn: new Date().toISOString(), version: 1, tablas: tablas.map(t => t.tabla) } }) + "\n";
  for (const { tabla } of tablas) {
    // El nombre sale del catálogo de la base, no del pedido; igual se valida.
    if (!/^[A-Za-z0-9_]+$/.test(tabla)) continue;
    for (let desde = 0; ; desde += TANDA) {
      const { rows } = await q(`select row_to_json(t)::text as j from "${tabla}" t order by ctid limit ${TANDA} offset ${desde}`);
      for (const f of rows) yield `{"t":${JSON.stringify(tabla)},"f":${f.j}}\n`;
      if (rows.length < TANDA) break;
    }
  }
  yield JSON.stringify({ fin: true }) + "\n";
  await guardarAjuste("ultimo_backup", new Date().toISOString()).catch(() => undefined);
}

export async function GET(req) {
  if (!autorizado(req)) return new Response("No encontrado", { status: 404 });
  const comprimido = Readable.from(lineas()).pipe(createGzip({ level: 6 }));
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(Readable.toWeb(comprimido), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="igera-backup-${fecha}.ndjson.gz"`,
      "Cache-Control": "no-store",
    },
  });
}
