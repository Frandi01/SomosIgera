import Link from "next/link";
import { redirect } from "next/navigation";
import { verificar, iniciarSesion, normEmail, limitarIngreso, usuarioActual } from "@/lib/auth";
import { safePath } from "@/lib/util";
import Aviso from "@/components/Aviso";
import { whatsapp } from "@/lib/ajustes";
import { q } from "@/lib/db";
import { accedePanel } from "@/lib/permisos";

export const metadata = { title: "Ingresar" };

async function ingresar(fd) {
  "use server";
  const volver = safePath(fd.get("volver"));
  const back = c => redirect(`/ingresar?error=${c}&volver=${encodeURIComponent(String(fd.get("volver") || ""))}`);
  const email = normEmail(fd.get("email"));
  if ((await limitarIngreso(email)).limitado) back("intentos");
  const id = await verificar(email, String(fd.get("password") || ""));
  if (!id) back("login");
  await iniciarSesion(id);
  // Sin destino pedido: el equipo va al panel de gestión; el resto, a su negocio.
  if (!fd.get("volver")) {
    const { rows } = await q("select rol from usuarios where id=$1", [id]);
    if (accedePanel(rows[0]?.rol)) redirect("/panel");
  }
  redirect(volver);
}

export default async function Ingresar(props) {
  const searchParams = await props.searchParams;
  if (await usuarioActual()) redirect("/negocio");
  const volver = searchParams.volver ? safePath(searchParams.volver) : "";
  const wa = await whatsapp().catch(() => null);
  return (
    <div className="wrap narrow section stack">
      <h1>Ingresar</h1>
      <Aviso error={searchParams.error} ok={searchParams.ok === "clave" ? "Listo, ya podés ingresar con tu contraseña nueva." : null} />
      <form action={ingresar} className="panel stack">
        <input type="hidden" name="volver" value={volver} />
        <label htmlFor="i-email">Email<input id="i-email" name="email" type="email" autoComplete="email" required /></label>
        <label htmlFor="i-pass">Contraseña<input id="i-pass" name="password" type="password" autoComplete="current-password" required /></label>
        <button className="button" type="submit">Ingresar</button>
      </form>
      <p className="muted">¿Fuiste a la jornada y todavía no tenés cuenta? <Link href={`/registro?volver=${encodeURIComponent(volver)}`}>Creala con tu código de asistente</Link></p>
      <p className="muted">¿Te olvidaste la contraseña? {wa ? <a href={`https://wa.me/${wa.id}?text=${encodeURIComponent("Hola Igera, me olvidé la contraseña de mi cuenta")}`} target="_blank" rel="noopener">Escribinos por WhatsApp</a> : "Escribinos por WhatsApp"} y te mandamos un link para cambiarla.</p>
    </div>
  );
}
