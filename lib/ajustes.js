// Ajustes editables desde el panel (como en DAIA: el número vive en la base, no en el código).
import { q } from "./db";
import { aWaId, display } from "./telefono";

export const MENSAJE_WA = "Hola Igera, quiero info de la jornada";

export async function leerAjustes() {
  const { rows } = await q("select clave, valor from ajustes");
  return Object.fromEntries(rows.map(r => [r.clave, r.valor]));
}
export async function guardarAjuste(clave, valor) {
  await q(`insert into ajustes (clave,valor) values ($1,$2)
           on conflict (clave) do update set valor=excluded.valor, actualizado=now()`, [clave, valor]);
}
// Datos de WhatsApp listos para usar en la página. null si todavía no hay número cargado.
export async function whatsapp() {
  const a = await leerAjustes();
  const id = aWaId(a.whatsapp_numero);
  if (!id) return null;
  const mensaje = a.whatsapp_mensaje || MENSAJE_WA;
  return { id, display: display(id), mensaje, link: `https://wa.me/${id}?text=${encodeURIComponent(mensaje)}` };
}
