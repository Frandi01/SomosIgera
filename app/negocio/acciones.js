"use server";
// Acciones del panel "Mi negocio". Cada una vuelve a leer la sesión y solo toca filas del usuario.
import { revalidatePath } from "next/cache";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import { MEDIOS, plantilla } from "@/lib/plantillas";
import { hoyAR, entero, texto } from "@/lib/negocio";

export async function cargarMovimiento(d) {
  const u = await exigir("negocio", "update", "/negocio");
  const tipo = d?.tipo === "gasto" ? "gasto" : d?.tipo === "venta" ? "venta" : null;
  const monto = entero(d?.monto, 1e11);
  if (!tipo || monto <= 0) return { ok: false, error: "Poné un monto mayor a cero." };
  const { rows: [n] } = await q("select plantilla, medios from negocios where usuario_id=$1", [u.id]);
  if (!n) return { ok: false, error: "Primero completá las preguntas de tu negocio." };
  const medio = d?.medio in MEDIOS ? d.medio : null;
  let itemId = null, detalle = texto(d?.detalle);
  if (tipo === "venta" && d?.itemId) {
    const { rows } = await q("select id, nombre from items where id=$1 and usuario_id=$2", [parseInt(d.itemId) || 0, u.id]);
    if (rows[0]) { itemId = rows[0].id; detalle = detalle || rows[0].nombre; }
  }
  const categoria = tipo === "gasto" && plantilla(n.plantilla).categoriasGasto.includes(d?.categoria) ? d.categoria : tipo === "gasto" ? "Otro" : null;
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(d?.fecha || "") ? d.fecha : hoyAR();
  const { rows } = await q(
    `insert into movimientos (usuario_id,fecha,tipo,monto,medio,item_id,categoria,detalle) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [u.id, fecha, tipo, monto, medio, itemId, categoria, detalle || null]);
  revalidatePath("/negocio");
  return { ok: true, id: String(rows[0].id) };
}

export async function borrarMovimiento(id) {
  const u = await exigir("negocio", "update", "/negocio");
  await q("delete from movimientos where id=$1 and usuario_id=$2", [String(parseInt(id) || 0), u.id]);
  revalidatePath("/negocio");
  revalidatePath("/negocio/movimientos");
  return { ok: true };
}
