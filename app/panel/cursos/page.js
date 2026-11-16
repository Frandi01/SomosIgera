import Link from "next/link";
import { redirect } from "next/navigation";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import { slugify } from "@/lib/cursos";
import PanelTabs from "@/components/PanelTabs";

export const metadata = { title: "Cursos" };
export const dynamic = "force-dynamic";

async function crear(fd) {
  "use server";
  await exigir("cursos", "create", "/panel/cursos");
  const titulo = String(fd.get("titulo") || "").trim().slice(0, 140);
  if (!titulo) redirect("/panel/cursos");
  let slug = slugify(titulo);
  const { rows: ex } = await q("select 1 from cursos where slug=$1", [slug]);
  if (ex.length) slug += "-" + Date.now().toString(36).slice(-4);
  const { rows } = await q("insert into cursos (slug,titulo) values ($1,$2) returning id", [slug, titulo]);
  redirect(`/panel/cursos/${rows[0].id}`);
}

export default async function CursosPanel() {
  const u = await exigir("cursos", "view", "/panel/cursos");
  const { rows } = await q(
    `select c.*, count(distinct l.id)::int lecciones, count(distinct p.usuario_id)::int alumnos
     from cursos c left join lecciones l on l.curso_id=c.id left join progreso p on p.leccion_id=l.id
     group by c.id order by c.creado desc`);
  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel/cursos" rol={u.rol} />
      <div className="stack">
        <form action={crear} className="panel row">
          <label htmlFor="c-titulo" style={{ flex: 1, minWidth: 220 }}>Nuevo curso<input id="c-titulo" name="titulo" placeholder="Ej: Números claros para salones" required /></label>
          <button className="btn" type="submit" style={{ alignSelf: "flex-end" }}>Crear curso</button>
        </form>
        <div className="tbl"><table>
          <thead><tr><th>Curso</th><th>Estado</th><th>Tipo</th><th>Lecciones</th><th>Alumnos</th><th></th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={6}>Todavía no hay cursos. Creá el primero con la grabación de la jornada.</td></tr> : rows.map(c => (
            <tr key={c.id}>
              <td>{c.titulo}</td>
              <td>{c.publicado ? <span className="pill ok">Publicado</span> : <span className="pill gray">Borrador</span>}</td>
              <td>{c.gratuito ? "Gratis" : "Pago (Fase 3)"}</td>
              <td className="num">{c.lecciones}</td><td className="num">{c.alumnos}</td>
              <td><Link className="btn ghost small" href={`/panel/cursos/${c.id}`}>Editar</Link></td>
            </tr>))}</tbody>
        </table></div>
      </div>
    </div>
  );
}
