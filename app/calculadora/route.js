// Calculadora de costos: contenido solo para asistentes con cuenta.
import { pagina } from "@/lib/estatica";
import { usuarioActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const u = await usuarioActual();
  if (!u || !puede(u.rol, "aprender")) return new Response(null, { status: 303, headers: { Location: "/ingresar?volver=%2Fcalculadora" } });
  return pagina("calculadora.html", req);
}
