import { cerrarSesion } from "@/lib/auth";
export async function POST(req) {
  await cerrarSesion();
  return Response.redirect(new URL("/", req.url), 303);
}
