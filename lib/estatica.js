// Páginas estáticas (content/*.html) servidas tal cual para que carguen al instante.
// El número de WhatsApp sale de Panel → Configuración, no del código.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { whatsapp } from "@/lib/ajustes";

const cache = new Map();
const leer = f => {
  if (!cache.has(f)) cache.set(f, fs.readFileSync(path.join(process.cwd(), "content", f), "utf8"));
  return cache.get(f);
};

export async function pagina(archivo, req) {
  const h = req.headers;
  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0];
  const origin = proto + "://" + (h.get("x-forwarded-host") || h.get("host") || "localhost");
  const wa = await whatsapp().catch(() => null);
  const html = leer(archivo)
    .replaceAll("{{ORIGIN}}", origin)
    .replaceAll("{{WA_DISPLAY}}", wa ? wa.display : "")
    .replace("{{WA_FOOTER}}", wa ? `  <div class="foot-wa"><span class="muted">WhatsApp</span><br><a href="${wa.link}" target="_blank" rel="noopener">${wa.display}</a></div>\n` : "")
    .replace("{{WA_BUTTON}}", wa ? `<a class="wa" href="${wa.link}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">WhatsApp</a>` : "");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
