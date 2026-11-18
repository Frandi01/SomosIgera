import "server-only";
import { headers } from "next/headers";
/** Dirección pública del sitio, tal como llegó el pedido (dominio propio o el de Railway). */
export async function origenPublico() {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") || "https").split(",")[0];
  return `${proto}://${h.get("x-forwarded-host") || h.get("host")}`;
}
