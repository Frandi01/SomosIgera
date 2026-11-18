// Exportar los movimientos propios: los datos son del usuario y se los puede llevar.
import { usuarioActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { q } from "@/lib/db";
export const dynamic = "force-dynamic";
const esc = v => { const s = v == null ? "" : String(v); return /^[=+\-@\t\r]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };
export async function GET(req) {
  const u = await usuarioActual();
  if (!u || !puede(u.rol, "negocio")) return new Response("No autorizado", { status: 401 });
  const mes = new URL(req.url).searchParams.get("mes");
  const filtro = /^\d{4}-\d{2}$/.test(mes || "");
  const { rows } = await q(
    `select to_char(fecha,'YYYY-MM-DD') fecha,tipo,monto,medio,categoria,detalle from movimientos
     where usuario_id=$1 ${filtro ? "and to_char(fecha,'YYYY-MM')=$2" : ""} order by fecha, id`, filtro ? [u.id, mes] : [u.id]);
  const cols = ["fecha", "tipo", "monto", "medio", "categoria", "detalle"];
  const csv = "﻿" + [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="movimientos-${filtro ? mes : "todos"}.csv"` } });
}
