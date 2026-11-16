// La landing es HTML estático (content/landing.html), servido tal cual para que cargue al instante.
import fs from "node:fs";
import path from "node:path";
export const dynamic = "force-dynamic";
const HTML = fs.readFileSync(path.join(process.cwd(), "content", "landing.html"), "utf8");
export function GET(req) {
  const h = req.headers;
  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0];
  const origin = proto + "://" + (h.get("x-forwarded-host") || h.get("host") || "localhost");
  return new Response(HTML.replaceAll("{{ORIGIN}}", origin), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
