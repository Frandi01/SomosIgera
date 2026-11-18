import { NextResponse } from "next/server";

// Primera capa de seguridad (como el middleware de DAIA):
// 1. Fuerza HTTPS en producción (Railway termina TLS y avisa el protocolo en x-forwarded-proto).
// 2. Sin cookie de sesión no se entra al panel, la cuenta ni al contenido para asistentes. El control real (sesión vigente,
//    cuenta activa y permiso por sección) lo hace cada página contra la base.
const PRIVADAS = ["/panel", "/cuenta", "/cursos", "/calculadora"];

export function proxy(req) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  const { pathname } = req.nextUrl;
  if (PRIVADAS.some(p => pathname === p || pathname.startsWith(p + "/")) && !req.cookies.get("igera_sesion")) {
    if (pathname.startsWith("/panel/csv")) return new NextResponse("No autorizado", { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "?volver=" + encodeURIComponent(pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|og.png|sitio.css|health|marca/|fonts/|favicon.svg|apple-touch-icon.png).*)"] };
