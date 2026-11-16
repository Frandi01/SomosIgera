// El panel viejo con token pasó a /panel (con usuario y contraseña).
export function GET(req) { return Response.redirect(new URL("/panel", req.url), 302); }
