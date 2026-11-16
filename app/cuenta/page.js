import Link from "next/link";
import { redirect } from "next/navigation";
import { exigir, cerrarOtras, cambiarMiPassword, limitar } from "@/lib/auth";
import { q } from "@/lib/db";
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
  const { rows } = await q(
    `select c.slug,c.titulo,count(l.id)::int total,count(p.leccion_id)::int hechas
     from cursos c join lecciones l on l.curso_id=c.id
     left join progreso p on p.leccion_id=l.id and p.usuario_id=$1
     where c.publicado group by c.id having count(p.leccion_id)>0 order by c.titulo`, [u.id]);
  return (
    <div className="wrap section stack">
      <Aviso error={searchParams.error} ok={OK[searchParams.ok]} />
      <div className="stack" style={{ gap: 6 }}>
        <h1>Hola, {u.nombre.split(" ")[0]}</h1>
        <p className="muted">{u.email} · <span className="pill">{ROL[u.rol]}</span></p>
      </div>
      <h2>Mis cursos</h2>
      {rows.length === 0 ? (
        <div className="panel stack"><p>Todavía no empezaste ningún curso.</p><div><Link className="btn" href="/cursos">Ver cursos</Link></div></div>
      ) : (
        <div className="cards">{rows.map(c => (
          <Link key={c.slug} href={`/cursos/${c.slug}`} className="panel card">
            <h3>{c.titulo}</h3>
            <div className="bar"><span style={{ width: `${Math.round(100 * c.hechas / c.total)}%` }} /></div>
            <p className="muted">{c.hechas} de {c.total} lecciones</p>
          </Link>))}
        </div>
      )}
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
