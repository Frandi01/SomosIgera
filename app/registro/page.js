import Link from "next/link";
import { redirect } from "next/navigation";
import { crearUsuario, iniciarSesion, normEmail, validEmail, limitar, usuarioActual, esDueno } from "@/lib/auth";
import { normalizarCodigo, codigoDisponible, usarCodigo } from "@/lib/codigos";
import { q } from "@/lib/db";
import { safePath, passwordValida } from "@/lib/util";
import Aviso from "@/components/Aviso";

export const metadata = { title: "Crear cuenta" };

async function registrar(fd) {
  "use server";
  const volver = safePath(fd.get("volver"));
  const codigo = normalizarCodigo(fd.get("codigo"));
  const back = c => redirect(`/registro?error=${c}&volver=${encodeURIComponent(volver)}${codigo ? `&codigo=${encodeURIComponent(codigo)}` : ""}`);
  if ((await limitar("registro", 10)).limitado) back("intentos");
  const nombre = String(fd.get("nombre") || "").trim().slice(0, 120);
  const email = normEmail(fd.get("email"));
  const password = String(fd.get("password") || "");
  if (!nombre || !email || !password) back("datos");
  if (!validEmail(email)) back("email");
  if (!passwordValida(password)) back("corta");
  // Por ahora solo se registran quienes asistieron a la jornada (código de la encuesta).
  // Los dueños de la plataforma (ADMIN_EMAILS) no lo necesitan.
  const dueno = esDueno(email);
  if (!dueno && !(await codigoDisponible(codigo))) back("codigo");
  const id = await crearUsuario({ email, nombre, password });
  if (!id) back("existe");
  if (!dueno && !(await usarCodigo(codigo, id))) {
    // Otro lo usó en el mismo instante: se deshace la cuenta recién creada.
    await q("delete from usuarios where id=$1", [id]);
    back("codigo");
  }
  await iniciarSesion(id);
  redirect(volver);
}

export default async function Registro(props) {
  const searchParams = await props.searchParams;
  if (await usuarioActual()) redirect("/cursos");
  const volver = safePath(searchParams.volver);
  return (
    <div className="wrap narrow section stack">
      <p className="eyebrow">Para asistentes a la jornada</p>
      <h1>Creá tu <em>cuenta.</em></h1>
      <p className="muted">Con tu cuenta entrás a la calculadora de costos, los cursos y la grabación de la jornada. Necesitás el código que recibiste al completar la encuesta del evento.</p>
      <Aviso error={searchParams.error} />
      <form action={registrar} className="panel stack">
        <input type="hidden" name="volver" value={volver} />
        <label htmlFor="r-codigo">Código de asistente<input id="r-codigo" name="codigo" defaultValue={searchParams.codigo || ""} placeholder="IGERA-XXX-XXX" autoCapitalize="characters" autoComplete="off" spellCheck={false} /></label>
        <label htmlFor="r-nombre">Nombre y apellido<input id="r-nombre" name="nombre" autoComplete="name" required /></label>
        <label htmlFor="r-email">Email<input id="r-email" name="email" type="email" autoComplete="email" required /></label>
        <label htmlFor="r-pass">Contraseña<small>Mínimo 8 caracteres, con letras y números</small><input id="r-pass" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
        <button className="button" type="submit">Crear cuenta</button>
      </form>
      <p className="muted">¿Ya tenés cuenta? <Link href={`/ingresar?volver=${encodeURIComponent(volver)}`}>Ingresá</Link></p>
    </div>
  );
}
