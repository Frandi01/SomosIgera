import { usuarioActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { q } from "@/lib/db";
export const dynamic = "force-dynamic";
const esc = v => { const s = v == null ? "" : String(v); return /^[=+\-@\t\r]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };
export async function GET() {
  const u = await usuarioActual();
  if (!u || !puede(u.rol, "encuesta", "view")) return new Response("No autorizado", { status: 401 });
  const { rows } = await q("select e.*, c.codigo, c.usado from encuestas e left join codigos c on c.encuesta_id=e.id order by e.fecha");
  const cols = ["fecha", "nombre", "email", "utilidad", "recomienda", "tema", "aplicar", "proximo", "comentario", "codigo", "usado"];
  const csv = "﻿" + [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c] instanceof Date ? r[c].toISOString() : r[c])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="encuesta-jornada.csv"' } });
}
