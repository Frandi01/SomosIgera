// La landing es HTML estático (content/landing.html), servido tal cual para que cargue al instante.
// El número de WhatsApp sale de Panel → Configuración, no del código.
import fs from "node:fs";
import path from "node:path";
import { whatsapp } from "@/lib/ajustes";

export const dynamic = "force-dynamic";
const HTML = fs.readFileSync(path.join(process.cwd(), "content", "landing.html"), "utf8");

export async function GET(req) {
  const h = req.headers;
  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0];
  const origin = proto + "://" + (h.get("x-forwarded-host") || h.get("host") || "localhost");
  const wa = await whatsapp().catch(() => null);
  const html = HTML
    .replaceAll("{{ORIGIN}}", origin)
    .replaceAll("{{WA_DISPLAY}}", wa ? wa.display : "")
    .replace("{{WA_FOOTER}}", wa ? `  <div>WhatsApp: <a href="${wa.link}" target="_blank" rel="noopener" style="color:var(--ink);font-weight:700">${wa.display}</a></div>\n` : "")
    .replace("{{WA_BUTTON}}", wa ? `<a class="wa" href="${wa.link}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">WhatsApp</a>` : "");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
