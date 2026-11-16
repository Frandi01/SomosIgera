import { NextResponse } from "next/server";

// Fuerza HTTPS en producción (Railway termina TLS y avisa el protocolo en x-forwarded-proto).
export function proxy(req) {
  if (process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|og.png|health).*)"] };
