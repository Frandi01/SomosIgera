import Link from "next/link";
import { q } from "@/lib/db";
import { exigir } from "@/lib/auth";

export const metadata = { title: "Cursos", description: "Cursos gratuitos de Somos Igera para emprendedores: costos, administración y marketing." };
export const dynamic = "force-dynamic";

export default async function Cursos() {
  // Contenido solo para asistentes con cuenta.
  const u = await exigir("aprender", "view", "/cursos");
  const { rows } = await q(
    `select c.slug,c.titulo,c.descripcion,c.gratuito,count(l.id)::int lecciones,coalesce(sum(l.minutos),0)::int minutos,
            count(p.leccion_id)::int hechas
     from cursos c left join lecciones l on l.curso_id=c.id
     left join progreso p on p.leccion_id=l.id and p.usuario_id=$1
     where c.publicado group by c.id order by c.creado desc`, [u?.id || 0]);
  return (
    <div className="wrap section stack">
      <div className="stack" style={{ gap: 8 }}>
        <p className="eyebrow">Formación práctica</p>
        <h1>Cursos</h1>
        <p className="muted" style={{ maxWidth: "60ch" }}>Contenido corto y aplicable, pensado para dueños y equipos de emprendimientos de La Plata.</p>
      </div>
      {rows.length === 0 ? (
        <div className="panel stack">
          <h3>Muy pronto</h3>
          <p className="muted">El primer curso llega después de la jornada del 29/11: la grabación completa, dividida en lecciones cortas.</p>
          
        </div>
      ) : (
        <div className="cards">{rows.map(c => (
          <Link key={c.slug} href={`/cursos/${c.slug}`} className="panel card">
            <div className="row" style={{ gap: 8 }}><span className="pill">{c.gratuito ? "Gratis" : "Pago"}</span><span className="muted">{c.lecciones} lecciones{c.minutos ? ` · ${c.minutos} min` : ""}</span></div>
            <h3>{c.titulo}</h3>
            <p className="muted">{c.descripcion.slice(0, 160)}{c.descripcion.length > 160 ? "…" : ""}</p>
            {u && c.lecciones > 0 && c.hechas > 0 && <><div className="bar"><span style={{ width: `${Math.round(100 * c.hechas / c.lecciones)}%` }} /></div><p className="muted">{c.hechas} de {c.lecciones} completadas</p></>}
          </Link>))}
        </div>
      )}
    </div>
  );
}
