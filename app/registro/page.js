import Link from "next/link";
import { redirect } from "next/navigation";
import { crearUsuario, iniciarSesion, normEmail, validEmail, limitar, usuarioActual } from "@/lib/auth";
import { safePath } from "@/lib/util";
import Aviso from "@/components/Aviso";

export const metadata = { title: "Crear cuenta" };

async function registrar(fd) {
  "use server";
  const volver = safePath(fd.get("volver"));
  const back = c => redirect(`/registro?error=${c}&volver=${encodeURIComponent(volver)}`);
  if (limitar("registro", 10)) back("intentos");
  const nombre = String(fd.get("nombre") || "").trim().slice(0, 120);
  const email = normEmail(fd.get("email"));
  const password = String(fd.get("password") || "");
  if (!nombre || !email || !password) back("datos");
  if (!validEmail(email)) back("email");
  if (password.length < 8) back("corta");
  const id = await crearUsuario({ email, nombre, password });
  if (!id) back("existe");
  await iniciarSesion(id);
  redirect(volver);
}

export default async function Registro({ searchParams }) {
  if (await usuarioActual()) redirect("/cursos");
  const volver = safePath(searchParams.volver);
  return (
    <div className="wrap narrow section stack">
      <p className="eyebrow">Gratis</p>
      <h1>Creá tu cuenta</h1>
      <p className="muted">Con tu cuenta accedés a los cursos gratuitos y guardás tu avance.</p>
      <Aviso error={searchParams.error} />
      <form action={registrar} className="panel stack">
        <input type="hidden" name="volver" value={volver} />
        <label htmlFor="r-nombre">Nombre y apellido<input id="r-nombre" name="nombre" autoComplete="name" required /></label>
        <label htmlFor="r-email">Email<input id="r-email" name="email" type="email" autoComplete="email" required /></label>
        <label htmlFor="r-pass">Contraseña<small>Mínimo 8 caracteres</small><input id="r-pass" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
        <button className="btn" type="submit">Crear cuenta</button>
      </form>
      <p className="muted">¿Ya tenés cuenta? <Link href={`/ingresar?volver=${encodeURIComponent(volver)}`}>Ingresá</Link></p>
    </div>
  );
}
