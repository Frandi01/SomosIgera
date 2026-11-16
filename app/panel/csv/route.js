import { q } from "@/lib/db";
import { usuarioActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await usuarioActual();
  if (!u || !puede(u.rol, "inscriptos", "export")) return new Response("No autorizado", { status: 401 });
  const { rows } = await q("select * from inscripciones order by fecha");
  const cols = ["fecha", "nombre", "whatsapp", "email", "negocio", "rubro", "rol", "asistentes", "charla", "origen", "fuente"];
  const esc = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const lines = [cols.concat("costo_calc", "precio_actual").join(",")].concat(
    rows.map(r => cols.map(c => esc(c === "fecha" ? r.fecha.toISOString() : r[c])).concat(esc(r.calculadora?.costo), esc(r.calculadora?.precio)).join(",")));
  return new Response("﻿" + lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=inscripciones.csv" } });
}
