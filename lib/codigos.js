// Códigos de asistente: cada persona que completa la encuesta de la jornada recibe uno, de un solo
// uso, que le permite crear su cuenta. La encuesta solo se abre con el link secreto del QR y
// mientras esté habilitada desde el panel.
import "server-only";
import crypto from "node:crypto";
import { q } from "./db";
import { leerAjustes, guardarAjuste } from "./ajustes";

// Sin 0/O, 1/I/L para que se pueda dictar y copiar sin errores.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const bloque = n => Array.from(crypto.randomBytes(n), b => ALFABETO[b % ALFABETO.length]).join("");

/** Lleva lo que escriba la persona al formato guardado: IGERA-XXX-XXX. */
export function normalizarCodigo(v) {
  let s = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.startsWith("IGERA")) s = s.slice(5);
  if (s.length !== 6) return null;
  return `IGERA-${s.slice(0, 3)}-${s.slice(3)}`;
}

export async function crearCodigo({ encuestaId = null, nota = null } = {}) {
  for (let i = 0; i < 5; i++) {
    const codigo = `IGERA-${bloque(3)}-${bloque(3)}`;
    const { rows } = await q("insert into codigos (codigo,encuesta_id,nota) values ($1,$2,$3) on conflict do nothing returning codigo", [codigo, encuestaId, nota]);
    if (rows[0]) return rows[0].codigo;
  }
  throw new Error("No se pudo generar un código único");
}

export async function codigoDisponible(codigo) {
  if (!codigo) return false;
  const { rows } = await q("select 1 from codigos where codigo=$1 and usado is null", [codigo]);
  return rows.length > 0;
}

/** Marca el código como usado por ese usuario. Atómico: si dos lo usan a la vez, gana uno solo. */
export async function usarCodigo(codigo, usuarioId) {
  const { rows } = await q("update codigos set usado=now(), usuario_id=$2 where codigo=$1 and usado is null returning codigo", [codigo, usuarioId]);
  return rows.length > 0;
}

export async function estadoEncuesta() {
  const a = await leerAjustes();
  let clave = a.encuesta_clave;
  if (!clave) { clave = crypto.randomBytes(9).toString("base64url"); await guardarAjuste("encuesta_clave", clave); }
  return { abierta: a.encuesta_abierta === "1", clave };
}

/** Compara la clave del link en tiempo constante. */
export function claveValida(recibida, clave) {
  const a = Buffer.from(String(recibida || "")), b = Buffer.from(clave);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function nuevaClave() {
  await guardarAjuste("encuesta_clave", crypto.randomBytes(9).toString("base64url"));
}
