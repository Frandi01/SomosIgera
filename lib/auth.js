// Usuarios, contraseñas y sesiones. Mismo criterio de seguridad que DAIA:
// - La cookie guarda un token aleatorio; la base guarda solo su hash.
// - En cada pedido se lee el usuario de la base: si lo desactivaron o le bajaron el rol, el
//   cambio vale al instante, sin esperar a que venza la cookie.
// - Los permisos salen de lib/permisos.js y se rechaza por defecto.
import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { q } from "./db";
import { normalizarRol, puede } from "./permisos";

const COOKIE = "igera_sesion";
const DIAS = 30;
const sha = t => crypto.createHash("sha256").update(t).digest("hex");
export const normEmail = e => String(e || "").trim().toLowerCase().slice(0, 200);
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Dueños de la plataforma: quedan como admin y nadie los puede bajar ni desactivar. */
export const duenos = () => (process.env.ADMIN_EMAILS || "").split(",").map(normEmail).filter(Boolean);
export const esDueno = email => duenos().includes(normEmail(email));

export async function hashPassword(p) { return bcrypt.hash(p, 11); }

export async function crearUsuario({ email, nombre, password }) {
  const rol = esDueno(email) ? "admin" : "alumno";
  const hash = await hashPassword(password);
  const { rows } = await q(
    "insert into usuarios (email,nombre,password_hash,rol) values ($1,$2,$3,$4) on conflict (email) do nothing returning id",
    [email, nombre, hash, rol]
  );
  return rows[0]?.id || null;
}

export async function verificar(email, password) {
  const { rows } = await q("select id,password_hash,rol,activo from usuarios where email=$1", [email]);
  // Se compara igual aunque el usuario no exista, para no revelar qué mails están registrados.
  const DUMMY = globalThis.__igeraDummy || (globalThis.__igeraDummy = bcrypt.hashSync("no-existe", 11));
  const ok = await bcrypt.compare(password, rows[0]?.password_hash || DUMMY);
  // Una cuenta desactivada recibe el mismo error que una contraseña mala.
  if (!rows[0] || !ok || !rows[0].activo) return null;
  if (esDueno(email) && rows[0].rol !== "admin") await q("update usuarios set rol='admin' where id=$1", [rows[0].id]);
  return rows[0].id;
}

export async function iniciarSesion(usuarioId) {
  const token = crypto.randomBytes(32).toString("base64url");
  await q("insert into sesiones (token_hash,usuario_id,vence) values ($1,$2,now() + interval '30 days')", [sha(token), usuarioId]);
  await q("update usuarios set ultimo_ingreso=now() where id=$1", [usuarioId]);
  await q("delete from sesiones where vence < now()");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: DIAS * 86400,
    secure: process.env.NODE_ENV === "production",
  });
}

async function tokenActual() { return (await cookies()).get(COOKIE)?.value || null; }

export async function cerrarSesion() {
  const t = await tokenActual();
  if (t) await q("delete from sesiones where token_hash=$1", [sha(t)]);
  (await cookies()).delete(COOKIE);
}

/** Usuario de la sesión, leído de la base en cada pedido. null si no hay sesión o está desactivado. */
export async function usuarioActual() {
  const t = await tokenActual();
  if (!t) return null;
  const { rows } = await q(
    `select u.id,u.email,u.nombre,u.rol from sesiones s join usuarios u on u.id=s.usuario_id
     where s.token_hash=$1 and s.vence > now() and u.activo`, [sha(t)]);
  if (!rows[0]) return null;
  return { ...rows[0], rol: normalizarRol(rows[0].rol) };
}

/** Exige sesión y permiso sobre una sección. Sin sesión → ingresar; sin permiso → mi cuenta. */
export async function exigir(seccion, accion = "view", volverA = "/") {
  const u = await usuarioActual();
  if (!u) redirect("/ingresar?volver=" + encodeURIComponent(volverA));
  if (!puede(u.rol, seccion, accion)) redirect("/cuenta?error=permiso");
  return u;
}

// Cerrar la sesión en los demás dispositivos: borra todas menos la actual (como en DAIA).
export async function cerrarOtras(usuarioId) {
  const t = await tokenActual();
  await q("delete from sesiones where usuario_id=$1 and token_hash <> $2", [usuarioId, t ? sha(t) : ""]);
}

/** Cambia la contraseña propia verificando la actual, y cierra las demás sesiones. */
export async function cambiarMiPassword(usuarioId, actual, nueva) {
  const { rows } = await q("select password_hash from usuarios where id=$1", [usuarioId]);
  if (!rows[0] || !(await bcrypt.compare(actual, rows[0].password_hash))) return false;
  await q("update usuarios set password_hash=$1 where id=$2", [await hashPassword(nueva), usuarioId]);
  await cerrarOtras(usuarioId);
  return true;
}

// Enlace de un solo uso para cambiar la contraseña, válido 48 h. Lo genera un admin desde el panel.
export async function crearLinkRestablecer(usuarioId) {
  const token = crypto.randomBytes(24).toString("base64url");
  await q("insert into restablecer (token_hash,usuario_id,vence) values ($1,$2,now() + interval '48 hours')", [sha(token), usuarioId]);
  return token;
}
export async function usarLinkRestablecer(token, password) {
  const { rows } = await q("delete from restablecer where token_hash=$1 and vence > now() returning usuario_id", [sha(token)]);
  if (!rows[0]) return null;
  await q("update usuarios set password_hash=$1 where id=$2", [await hashPassword(password), rows[0].usuario_id]);
  await q("delete from sesiones where usuario_id=$1", [rows[0].usuario_id]);
  return rows[0].usuario_id;
}

// Límite de intentos en memoria, ventana fija (como DAIA lib/rate-limit.ts). Una sola réplica:
// si algún día se escala a varias, hay que pasarlo a la base o a Redis.
const cubetas = globalThis.__igeraCubetas || (globalThis.__igeraCubetas = new Map());
export async function ipCliente() {
  const h = await headers();
  return (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
}
export function contar(clave, max, ventanaMs) {
  const now = Date.now();
  if (cubetas.size > 5000) for (const [k, b] of cubetas) if (now > b.vence) cubetas.delete(k);
  const b = cubetas.get(clave);
  if (!b || now > b.vence) { cubetas.set(clave, { n: 1, vence: now + ventanaMs }); return { limitado: false, minutos: 0 }; }
  b.n++;
  return b.n > max ? { limitado: true, minutos: Math.max(1, Math.ceil((b.vence - now) / 60e3)) } : { limitado: false, minutos: 0 };
}
/** Límite por IP para formularios públicos (registro, restablecer). */
export async function limitar(clave, max = 10, ventanaMs = 15 * 60e3) {
  return contar(`${clave}:${await ipCliente()}`, max, ventanaMs);
}
/** Ingreso: 8 intentos por IP y mail y 30 por IP cada 10 minutos (los mismos números que DAIA). */
export async function limitarIngreso(email) {
  const ip = await ipCliente();
  const porMail = contar(`login:${ip}:${email}`, 8, 10 * 60e3);
  const porIp = contar(`login:${ip}`, 30, 10 * 60e3);
  return porMail.limitado ? porMail : porIp;
}
