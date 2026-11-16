import Link from "next/link";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import Aviso from "@/components/Aviso";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";
const ROL = { admin: "Administrador", equipo: "Equipo", alumno: "Alumno" };

export default async function Cuenta({ searchParams }) {
  const u = await exigir("alumno", "/cuenta");
  const { rows } = await q(
    `select c.slug,c.titulo,count(l.id)::int total,count(p.leccion_id)::int hechas
     from cursos c join lecciones l on l.curso_id=c.id
     left join progreso p on p.leccion_id=l.id and p.usuario_id=$1
     where c.publicado group by c.id having count(p.leccion_id)>0 order by c.titulo`, [u.id]);
  return (
    <div className="wrap section stack">
      <Aviso error={searchParams.error} />
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
    </div>
  );
}
