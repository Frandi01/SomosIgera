// Restaura una copia de seguridad de Igera (igera-backup-AAAA-MM-DD.ndjson.gz).
//
// Arma un archivo .sql al lado del backup y, si le pasás la base, lo aplica con psql.
//
//   node scripts/restaurar-backup.mjs igera-backup-2026-11-16.ndjson.gz
//       → genera igera-backup-2026-11-16.sql (no toca ninguna base)
//   node scripts/restaurar-backup.mjs igera-backup-2026-11-16.ndjson.gz "postgresql://..."
//       → además lo aplica a esa base (tiene que tener las tablas: arrancá la web una vez contra esa base)
//
// Es idempotente: las filas que ya existen (mismo id) se saltean. Las claves foráneas se
// desactivan durante la carga para no depender del orden de las tablas.
import { createReadStream, createWriteStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const [archivo, baseUrl] = process.argv.slice(2);
if (!archivo) {
  console.error("Uso: node scripts/restaurar-backup.mjs <backup.ndjson.gz> [DATABASE_URL]");
  process.exit(1);
}

const salida = archivo.replace(/\.ndjson\.gz$/, "") + ".sql";
const out = createWriteStream(salida);
const tag = `$igera_${randomBytes(6).toString("hex")}$`;
const TANDA = 200;

const pendientes = new Map(); // tabla → filas (texto JSON)
const cuenta = new Map();
let meta = null;
let completo = false;

function volcar(tabla) {
  const filas = pendientes.get(tabla);
  if (!filas?.length) return;
  const json = `[${filas.join(",")}]`;
  if (json.includes(tag)) throw new Error("Colisión de delimitador: volvé a correr el script.");
  out.write(
    `INSERT INTO "${tabla}" SELECT * FROM json_populate_recordset(NULL::"${tabla}", ${tag}${json}${tag}::json) ON CONFLICT DO NOTHING;\n`,
  );
  pendientes.set(tabla, []);
}

out.write("BEGIN;\nSET session_replication_role = replica;\n");
const rl = createInterface({ input: createReadStream(archivo).pipe(createGunzip()), crlfDelay: Infinity });
for await (const linea of rl) {
  if (!linea.trim()) continue;
  if (linea.startsWith('{"meta"')) { meta = JSON.parse(linea).meta; continue; }
  if (linea.startsWith('{"fin"')) { completo = true; continue; }
  // {"t":"Tabla","f":{...}} — se corta a mano para no re-serializar la fila.
  const m = /^\{"t":"([A-Za-z0-9_]+)","f":(.*)\}$/.exec(linea);
  if (!m) throw new Error(`Línea inesperada: ${linea.slice(0, 80)}`);
  const [, tabla, fila] = m;
  if (!pendientes.has(tabla)) pendientes.set(tabla, []);
  pendientes.get(tabla).push(fila);
  cuenta.set(tabla, (cuenta.get(tabla) ?? 0) + 1);
  if (pendientes.get(tabla).length >= TANDA) volcar(tabla);
}
for (const t of pendientes.keys()) volcar(t);
out.write("SET session_replication_role = DEFAULT;\nCOMMIT;\n");
await new Promise((r) => out.end(r));

if (!completo) console.warn("⚠ El backup no termina con la marca de fin: puede estar cortado.");
console.log(`Backup del ${meta?.exportadoEn ?? "?"}`);
for (const [t, n] of [...cuenta.entries()].sort()) console.log(`  ${t}: ${n}`);
console.log(`SQL listo: ${salida}`);

if (baseUrl) {
  console.log("Aplicando a la base…");
  execFileSync("psql", [baseUrl, "-v", "ON_ERROR_STOP=1", "-q", "-f", salida], { stdio: "inherit" });
  console.log("Restauración terminada.");
}
