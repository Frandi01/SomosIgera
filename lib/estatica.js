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
const atributoHtml = valor => valor.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export async function pagina(archivo, req, { logueado = false } = {}) {
  const h = req.headers;
  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0];
  const origin = proto + "://" + (h.get("x-forwarded-host") || h.get("host") || "localhost");
  const wa = await whatsapp().catch(() => null);
  const html = leer(archivo)
    .replaceAll("{{ORIGIN}}", origin)
    .replaceAll("{{WA_DISPLAY}}", wa ? wa.display : "")
    .replace("{{JORNADA_ESCENA}}", () => atributoHtml(leer("landing-escena.html")))
    .replace("{{WA_FOOTER}}", wa ? `  <div class="foot-wa"><span class="muted">WhatsApp</span><br><a href="${wa.link}" target="_blank" rel="noopener">${wa.display}</a></div>\n` : "")
    .replace("{{WA_BUTTON}}", wa ? `<a class="wa" href="${wa.link}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">WhatsApp</a>` : "");
  // Con sesión abierta, el menú del sitio lleva a su negocio en vez de pedir que ingrese.
  const final = logueado ? html.replaceAll('<a href="/ingresar">Ingresar</a>', '<a href="/negocio">Mi negocio</a>') : html;
  return new Response(final, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
}
