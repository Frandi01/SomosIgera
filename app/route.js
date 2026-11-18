// Inicio: landing de la jornada, enfocada en convertir interesados en inscriptos.
import { pagina } from "@/lib/estatica";
import { usuarioActual } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const u = await usuarioActual().catch(() => null);
  return pagina("landing.html", req, { logueado: Boolean(u) });
}
