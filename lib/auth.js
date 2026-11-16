// Usuarios, contraseñas y sesiones. La cookie guarda un token aleatorio; la base guarda solo su hash.
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { q } from "./db";

const COOKIE = "igera_sesion";
const DIAS = 30;
const sha = t => crypto.createHash("sha256").update(t).digest("hex");
export const normEmail = e => String(e || "").trim().toLowerCase().slice(0, 200);
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const admins = () => (process.env.ADMIN_EMAILS || "").split(",").map(normEmail).filter(Boolean);

export async function hashPassword(p) { return bcrypt.hash(p, 11); }

export async function crearUsuario({ email, nombre, password }) {
  const rol = admins().includes(email) ? "admin" : "alumno";
  const hash = await hashPassword(password);
  const { rows } = await q(
    "insert into usuarios (email,nombre,password_hash,rol) values ($1,$2,$3,$4) on conflict (email) do nothing returning id",
    [email, nombre, hash, rol]
  );
  return rows[0]?.id || null;
}

export async function verificar(email, password) {
  const { rows } = await q("select id,password_hash,rol from usuarios where email=$1", [email]);
  // Se compara igual aunque el usuario no exista, para no revelar qué mails están registrados.
  const DUMMY = globalThis.__igeraDummy || (globalThis.__igeraDummy = bcrypt.hashSync("no-existe", 11));
  const ok = await bcrypt.compare(password, rows[0]?.password_hash || DUMMY);
  if (!rows[0] || !ok) return null;
  if (admins().includes(email) && rows[0].rol !== "admin") await q("update usuarios set rol='admin' where id=$1", [rows[0].id]);
  return rows[0].id;
}

export async function iniciarSesion(usuarioId) {
  const token = crypto.randomBytes(32).toString("base64url");
  await q("insert into sesiones (token_hash,usuario_id,vence) values ($1,$2,now() + interval '30 days')", [sha(token), usuarioId]);
  await q("delete from sesiones where vence < now()");
  cookies().set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: DIAS * 86400,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function cerrarSesion() {
  const t = cookies().get(COOKIE)?.value;
  if (t) await q("delete from sesiones where token_hash=$1", [sha(t)]);
  cookies().delete(COOKIE);
}

export async function usuarioActual() {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  const { rows } = await q(
    `select u.id,u.email,u.nombre,u.rol from sesiones s join usuarios u on u.id=s.usuario_id
     where s.token_hash=$1 and s.vence > now()`, [sha(t)]);
  return rows[0] || null;
}

const NIVEL = { alumno: 1, equipo: 2, admin: 3 };
export async function exigir(rol = "alumno", volverA = "/") {
  const u = await usuarioActual();
  if (!u) redirect("/ingresar?volver=" + encodeURIComponent(volverA));
  if (NIVEL[u.rol] < NIVEL[rol]) redirect("/cuenta?error=permiso");
  return u;
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

// Límite simple de intentos por IP, en memoria.
const intentos = globalThis.__igeraIntentos || (globalThis.__igeraIntentos = new Map());
export function limitar(clave, max = 10, ventanaMs = 15 * 60e3) {
  const ip = (headers().get("x-forwarded-for") || "local").split(",")[0].trim();
  const k = clave + ":" + ip, now = Date.now();
  const arr = (intentos.get(k) || []).filter(t => now - t < ventanaMs);
  arr.push(now); intentos.set(k, arr);
  return arr.length > max;
}
