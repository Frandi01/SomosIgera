import { q } from "@/lib/db";
export const dynamic = "force-dynamic";

const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const hits = globalThis.__igeraHits || (globalThis.__igeraHits = new Map());

export async function POST(req) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < 3600e3)) hits.delete(k);
  const arr = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  arr.push(now); hits.set(ip, arr);
  if (arr.length > 10) return new Response("Demasiados intentos", { status: 429 });
  const text = await req.text();
  if (text.length > 20000) return new Response("Muy grande", { status: 413 });
  let d; try { d = JSON.parse(text); } catch { return new Response("Formato inválido", { status: 400 }); }
  const r = {};
  for (const f of ["nombre", "whatsapp", "email", "negocio", "rubro", "rol", "charla", "origen"]) r[f] = clean(d[f]);
  r.asistentes = Math.min(10, Math.max(1, parseInt(d.asistentes) || 1));
  r.fuente = clean(d.fuente, 20).replace(/[^a-z0-9_-]/gi, "") || "directo";
  if (!r.nombre || !r.whatsapp || !/^\S+@\S+\.\S+$/.test(r.email)) return new Response("Datos incompletos", { status: 400 });
  let calc = null;
  if (d.calculadora && typeof d.calculadora === "object") {
    const c = d.calculadora; calc = { servicio: clean(c.servicio, 80) };
    for (const k of ["costo", "sugerido", "precio", "ganancia", "ocupacion", "fijos"]) calc[k] = Number(c[k]) || 0;
  }
  await q(`insert into inscripciones (nombre,whatsapp,email,negocio,rubro,rol,asistentes,charla,origen,fuente,calculadora)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [r.nombre, r.whatsapp, r.email, r.negocio, r.rubro, r.rol, r.asistentes, r.charla, r.origen, r.fuente, calc]);
  return Response.json({ ok: true }, { status: 201 });
}
