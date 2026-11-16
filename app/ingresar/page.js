import Link from "next/link";
import { redirect } from "next/navigation";
import { verificar, iniciarSesion, normEmail, limitar, usuarioActual } from "@/lib/auth";
import { safePath } from "@/lib/util";
import Aviso from "@/components/Aviso";

export const metadata = { title: "Ingresar" };

async function ingresar(fd) {
  "use server";
  const volver = safePath(fd.get("volver"));
  const back = c => redirect(`/ingresar?error=${c}&volver=${encodeURIComponent(volver)}`);
  if (limitar("login", 10)) back("intentos");
  const id = await verificar(normEmail(fd.get("email")), String(fd.get("password") || ""));
  if (!id) back("login");
  await iniciarSesion(id);
  redirect(volver);
}

export default async function Ingresar({ searchParams }) {
  if (await usuarioActual()) redirect("/cursos");
  const volver = safePath(searchParams.volver);
  return (
    <div className="wrap narrow section stack">
      <h1>Ingresar</h1>
      <Aviso error={searchParams.error} ok={searchParams.ok === "clave" ? "Listo, ya podés ingresar con tu contraseña nueva." : null} />
      <form action={ingresar} className="panel stack">
        <input type="hidden" name="volver" value={volver} />
        <label htmlFor="i-email">Email<input id="i-email" name="email" type="email" autoComplete="email" required /></label>
        <label htmlFor="i-pass">Contraseña<input id="i-pass" name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn" type="submit">Ingresar</button>
      </form>
      <p className="muted">¿No tenés cuenta? <Link href={`/registro?volver=${encodeURIComponent(volver)}`}>Creala gratis</Link></p>
      <p className="muted">¿Te olvidaste la contraseña? Escribinos por WhatsApp y te mandamos un link para cambiarla.</p>
    </div>
  );
}
