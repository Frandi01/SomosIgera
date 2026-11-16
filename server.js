// Somos Igera — landing Fase 1. Servidor sin dependencias.
// Inscripciones: una línea JSON por inscripto en $DATA_DIR/inscripciones.jsonl
// (en Railway, montar un Volume en /data para que no se borren al redeployar).
// Panel del equipo: /admin?token=ADMIN_TOKEN  ·  CSV: /admin.csv?token=ADMIN_TOKEN
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const FILE = path.join(DATA_DIR, "inscripciones.jsonl");
const INDEX = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
const OG = fs.readFileSync(path.join(__dirname, "public", "og.png"));
const ICS = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Somos Igera//Jornada//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  "BEGIN:VEVENT", "UID:jornada-salones-20261129@somosigera", "DTSTAMP:20261116T150000Z",
  "DTSTART:20261129T190000Z", "DTEND:20261129T220000Z",
  "SUMMARY:Jornada Somos Igera · Números claros para salones",
  "DESCRIPTION:Jornada gratuita sobre costos\\, administración y marketing para salones. La sede llega por mail.",
  "LOCATION:La Plata\\, Buenos Aires",
  "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:Hoy es la jornada de Somos Igera", "END:VALARM",
  "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
fs.mkdirSync(DATA_DIR, { recursive: true });

const FIELDS = ["nombre", "whatsapp", "email", "negocio", "rubro", "rol", "asistentes", "charla", "origen", "fuente"];
const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return fs.readFileSync(FILE, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const authed = url => ADMIN_TOKEN && url.searchParams.get("token") === ADMIN_TOKEN;

const hits = new Map(); // límite simple: 10 inscripciones por IP por hora
function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  arr.push(now); hits.set(ip, arr); return arr.length > 10;
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (req.method === "POST" && url.pathname === "/api/inscripciones") {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    if (limited(ip)) { res.writeHead(429); return res.end("Demasiados intentos"); }
    let body = "";
    req.on("data", c => { body += c; if (body.length > 20000) req.destroy(); });
    req.on("end", () => {
      try {
        const d = JSON.parse(body), row = { fecha: new Date().toISOString() };
        FIELDS.forEach(f => row[f] = clean(d[f]));
        row.asistentes = Math.min(10, Math.max(1, parseInt(d.asistentes) || 1));
        row.fuente = clean(d.fuente, 20).replace(/[^a-z0-9_-]/gi, "") || "directo";
        if (!row.nombre || !row.whatsapp || !/^\S+@\S+\.\S+$/.test(row.email)) { res.writeHead(400); return res.end("Datos incompletos"); }
        if (d.calculadora && typeof d.calculadora === "object") {
          const c = d.calculadora; row.calculadora = { servicio: clean(c.servicio, 80) };
          ["costo", "sugerido", "precio", "ganancia", "ocupacion", "fijos"].forEach(k => row.calculadora[k] = Number(c[k]) || 0);
        }
        fs.appendFileSync(FILE, JSON.stringify(row) + "\n");
        res.writeHead(201, { "Content-Type": "application/json" }); res.end('{"ok":true}');
      } catch { res.writeHead(400); res.end("Formato inválido"); }
    });
    return;
  }

  if (url.pathname === "/admin.csv") {
    if (!authed(url)) { res.writeHead(401); return res.end("No autorizado"); }
    const cols = ["fecha", ...FIELDS, "costo_calc", "precio_actual"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const lines = [cols.join(",")].concat(readAll().map(r => [...cols.slice(0, -2).map(c => r[c]), r.calculadora?.costo, r.calculadora?.precio].map(q).join(",")));
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=inscripciones.csv" });
    return res.end("﻿" + lines.join("\n"));
  }

  if (url.pathname === "/admin") {
    if (!authed(url)) { res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No autorizado"); }
    const rows = readAll().reverse(), total = rows.reduce((t, r) => t + (r.asistentes || 1), 0);
    const tr = rows.map(r => `<tr><td>${esc(new Date(r.fecha).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }))}</td>${FIELDS.map(f => `<td>${esc(r[f])}</td>`).join("")}<td>${r.calculadora ? "$" + Math.round(r.calculadora.costo).toLocaleString("es-AR") : "—"}</td></tr>`).join("");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inscriptos · Somos Igera</title>
<style>body{font:14px system-ui;margin:24px;color:#16202E}table{border-collapse:collapse}td,th{border-bottom:1px solid #DDE2EA;padding:6px 10px;text-align:left;white-space:nowrap}th{background:#E8EEF5}div{overflow-x:auto}</style>
<h1>Inscriptos: ${total} <small style="font-weight:400">(${rows.length} formularios · meta 50)</small></h1>
<p>Por fuente: ${Object.entries(rows.reduce((m, r) => (m[r.fuente || "directo"] = (m[r.fuente || "directo"] || 0) + (r.asistentes || 1), m), {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => esc(k) + " " + v).join(" · ") || "—"}</p>
<p><a href="/admin.csv?token=${encodeURIComponent(ADMIN_TOKEN)}">Descargar CSV</a></p>
<div><table><tr><th>Fecha</th>${FIELDS.map(f => `<th>${f}</th>`).join("")}<th>Costo calc.</th></tr>${tr || '<tr><td colspan="12">Todavía no hay inscriptos.</td></tr>'}</table></div>`);
  }

  if (url.pathname === "/api/stats") {
    const n = readAll().reduce((t, r) => t + (r.asistentes || 1), 0);
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "max-age=60" });
    return res.end(JSON.stringify({ inscriptos: n }));
  }
  if (url.pathname === "/og.png") { res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "max-age=86400" }); return res.end(OG); }
  if (url.pathname === "/jornada.ics") {
    res.writeHead(200, { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=jornada-somos-igera.ics" });
    return res.end(ICS);
  }
  if (url.pathname === "/health") { res.writeHead(200); return res.end("ok"); }
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const proto = (req.headers["x-forwarded-proto"] || "http").split(",")[0];
    const origin = proto + "://" + (req.headers["x-forwarded-host"] || req.headers.host || "localhost");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(INDEX.replaceAll("{{ORIGIN}}", origin));
  }
  res.writeHead(302, { Location: "/" }); res.end();
}).listen(PORT, () => console.log("Igera escuchando en " + PORT));
