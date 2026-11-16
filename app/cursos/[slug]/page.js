import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { q } from "@/lib/db";
import { usuarioActual, exigir } from "@/lib/auth";
import { puede } from "@/lib/permisos";

export const dynamic = "force-dynamic";

async function getCurso(slug, u) {
  const { rows: [c] } = await q("select * from cursos where slug=$1", [slug]);
  if (!c || (!c.publicado && (!u || !puede(u.rol, "cursos", "view")))) return null;
  return c;
}
export async function generateMetadata(props) {
  const params = await props.params;
  const { rows: [c] } = await q("select titulo,descripcion from cursos where slug=$1 and publicado", [params.slug]);
  return c ? { title: c.titulo, description: c.descripcion.slice(0, 160) } : { title: "Curso" };
}

async function marcar(fd) {
  "use server";
  const slug = String(fd.get("slug")), lid = parseInt(fd.get("leccion")), next = parseInt(fd.get("siguiente")) || lid;
  const u = await exigir("aprender", "view", `/cursos/${slug}`);
  if (!lid) redirect(`/cursos/${slug}`);
  if (fd.get("hecha") === "1") await q("delete from progreso where usuario_id=$1 and leccion_id=$2", [u.id, lid]);
  else await q("insert into progreso (usuario_id,leccion_id) values ($1,$2) on conflict do nothing", [u.id, lid]);
  redirect(`/cursos/${slug}?l=${next}`);
}

export default async function Curso(props) {
  const params = await props.params, searchParams = await props.searchParams;
  const u = await usuarioActual();
  const c = await getCurso(params.slug, u);
  if (!c) notFound();
  const { rows: ls } = await q(
    `select l.*, (p.leccion_id is not null) hecha from lecciones l
     left join progreso p on p.leccion_id=l.id and p.usuario_id=$2
     where l.curso_id=$1 order by l.orden,l.id`, [c.id, u?.id || 0]);
  const hechas = ls.filter(l => l.hecha).length;
  const i = Math.max(0, ls.findIndex(l => l.id === parseInt(searchParams.l)));
  const l = ls[i], sig = ls[i + 1];

  return (
    <div className="wrap section stack">
      <div className="stack" style={{ gap: 8 }}>
        <Link href="/cursos">← Cursos</Link>
        <h1>{c.titulo}</h1>
        {!c.publicado && <p><span className="pill gray">Borrador: solo lo ve el equipo</span></p>}
        {c.descripcion && <p className="muted" style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{c.descripcion}</p>}
      </div>
      {ls.length === 0 ? <div className="panel"><p>Este curso todavía no tiene lecciones.</p></div> : (
        <div className="course">
          <div className="stack" style={{ minWidth: 0 }}>
            {!u ? (
              <div className="panel stack" style={{ alignItems: "flex-start" }}>
                <span className="pill">Gratis</span>
                <h2>Creá tu cuenta para ver el curso</h2>
                <p className="muted">Son {ls.length} lecciones. Con tu cuenta guardás el avance y te avisamos de los próximos cursos.</p>
                <div className="row">
                  <Link className="btn" href={`/registro?volver=/cursos/${c.slug}`}>Crear cuenta gratis</Link>
                  <Link className="btn ghost" href={`/ingresar?volver=/cursos/${c.slug}`}>Ya tengo cuenta</Link>
                </div>
              </div>
            ) : (
              <>
                {l.youtube_id ? (
                  <div className="video">
                    <iframe src={`https://www.youtube-nocookie.com/embed/${l.youtube_id}?rel=0&modestbranding=1`} title={l.titulo}
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
                  </div>
                ) : <div className="panel"><p className="muted">Esta lección no tiene video.</p></div>}
                <div className="stack" style={{ gap: 8 }}>
                  <p className="eyebrow">Lección {i + 1} de {ls.length}{l.minutos ? ` · ${l.minutos} min` : ""}</p>
                  <h2>{l.titulo}</h2>
                  {l.descripcion && <p style={{ whiteSpace: "pre-line" }}>{l.descripcion}</p>}
                  {l.material_url && <p><a href={l.material_url} target="_blank" rel="noopener noreferrer">Descargar material de la lección</a></p>}
                </div>
                <form action={marcar} className="row">
                  <input type="hidden" name="slug" value={c.slug} />
                  <input type="hidden" name="leccion" value={l.id} />
                  <input type="hidden" name="hecha" value={l.hecha ? "1" : "0"} />
                  <input type="hidden" name="siguiente" value={!l.hecha && sig ? sig.id : l.id} />
                  <button className="btn" type="submit">{l.hecha ? "Marcar como pendiente" : sig ? "Completar y seguir" : "Marcar como completada"}</button>
                  {sig && <Link className="btn ghost" href={`/cursos/${c.slug}?l=${sig.id}`}>Siguiente lección</Link>}
                </form>
              </>
            )}
          </div>
          <aside className="panel stack" style={{ gap: 10 }}>
            <h3>Contenido</h3>
            {u && <><div className="bar"><span style={{ width: `${Math.round(100 * hechas / ls.length)}%` }} /></div><p className="muted">{hechas} de {ls.length} completadas</p></>}
            <nav className="lessons" aria-label="Lecciones">
              {ls.map((x, n) => (
                <Link key={x.id} href={u ? `/cursos/${c.slug}?l=${x.id}` : `/registro?volver=/cursos/${c.slug}`} aria-current={u && x.id === l.id ? "true" : undefined}>
                  <span className={x.hecha ? "n done" : "n"}>{x.hecha ? "✓" : n + 1}</span><span>{x.titulo}{x.minutos ? <span className="muted"> · {x.minutos} min</span> : null}</span>
                </Link>))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
