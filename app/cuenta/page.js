import { redirect } from "next/navigation";
import { exigir, cerrarOtras, cambiarMiPassword, limitar } from "@/lib/auth";
import { passwordValida } from "@/lib/util";
import Aviso from "@/components/Aviso";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

async function cambiarClave(fd) {
  "use server";
  const u = await exigir("cuenta", "update", "/cuenta");
  if ((await limitar(`clave:${u.id}`, 8, 10 * 60e3)).limitado) redirect("/cuenta?error=intentos");
  const actual = String(fd.get("actual") || ""), nueva = String(fd.get("nueva") || ""), repetir = String(fd.get("repetir") || "");
  if (!passwordValida(nueva)) redirect("/cuenta?error=corta");
  if (nueva !== repetir) redirect("/cuenta?error=repetir");
  if (!(await cambiarMiPassword(u.id, actual, nueva))) redirect("/cuenta?error=actual");
  redirect("/cuenta?ok=clave");
}
async function salirDeOtros() {
  "use server";
  const u = await exigir("cuenta", "update", "/cuenta");
  await cerrarOtras(u.id);
  redirect("/cuenta?ok=sesiones");
}

const ROL = { admin: "Administrador", equipo: "Equipo", alumno: "Alumno" };
const OK = {
  clave: "Contraseña cambiada. Se cerró la sesión en los demás dispositivos.",
  sesiones: "Se cerró la sesión en los demás dispositivos.",
};

export default async function Cuenta(props) {
  const searchParams = await props.searchParams;
  const u = await exigir("cuenta", "view", "/cuenta");
  return (
    <div className="wrap section stack">
      <Aviso error={searchParams.error} ok={OK[searchParams.ok]} />
      <div className="stack" style={{ gap: 6 }}>
        <h1>Hola, {u.nombre.split(" ")[0]}</h1>
        <p className="muted">{u.email} · <span className="pill">{ROL[u.rol]}</span></p>
      </div>
      <h2>Tu contenido</h2>
      <div className="cards">
        <a href="/calculadora" className="panel card"><span className="eyebrow">Herramienta</span><h3>Calculadora de costos</h3><p className="muted">Cuánto te cuesta cada servicio, a cuánto cobrarlo y cuántos necesitás para cubrir el mes.</p></a>
      </div>
      <h2>Seguridad</h2>
      <div className="panel stack">
        <form action={cambiarClave} className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <label htmlFor="c-act">Contraseña actual<input id="c-act" name="actual" type="password" autoComplete="current-password" required /></label>
          <label htmlFor="c-new">Nueva<input id="c-new" name="nueva" type="password" autoComplete="new-password" minLength={8} placeholder="8+ con letras y números" required /></label>
          <label htmlFor="c-rep">Repetir nueva<input id="c-rep" name="repetir" type="password" autoComplete="new-password" minLength={8} required /></label>
          <div className="full"><button className="btn" type="submit">Cambiar contraseña</button></div>
        </form>
        <form action={salirDeOtros}><button className="btn ghost small" type="submit">Cerrar sesión en los demás dispositivos</button></form>
      </div>
    </div>
  );
}
