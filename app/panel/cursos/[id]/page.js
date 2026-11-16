import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import { youtubeId, safeUrl } from "@/lib/cursos";
import PanelTabs from "@/components/PanelTabs";

export const metadata = { title: "Editar curso" };
export const dynamic = "force-dynamic";
const back = (id, extra = "") => redirect(`/panel/cursos/${id}${extra}`);

async function guardarCurso(fd) {
  "use server";
  await exigir("equipo");
  const id = parseInt(fd.get("id"));
  if (!id) redirect("/panel/cursos");
  await q("update cursos set titulo=$1, descripcion=$2, publicado=$3, gratuito=$4 where id=$5", [
    String(fd.get("titulo") || "").trim().slice(0, 140) || "Sin título",
    String(fd.get("descripcion") || "").trim().slice(0, 2000),
    fd.get("publicado") === "on", fd.get("gratuito") !== "off", id]);
  revalidatePath("/cursos");
  back(id, "?ok=1");
}
async function guardarLeccion(fd) {
  "use server";
  await exigir("equipo");
  const curso = parseInt(fd.get("curso")), lid = parseInt(fd.get("leccion")) || null;
  if (!curso) redirect("/panel/cursos");
  const video = String(fd.get("video") || "").trim();
  const yt = video ? youtubeId(video) : null;
  if (video && !yt) back(curso, "?error=video");
  const material = String(fd.get("material") || "").trim();
  const mat = material ? safeUrl(material) : null;
  if (material && !mat) back(curso, "?error=material");
  const vals = [String(fd.get("titulo") || "").trim().slice(0, 140) || "Lección", String(fd.get("descripcion") || "").trim().slice(0, 3000),
    yt, mat, parseInt(fd.get("minutos")) || null, parseInt(fd.get("orden")) || 1];
  if (lid) await q("update lecciones set titulo=$1,descripcion=$2,youtube_id=$3,material_url=$4,minutos=$5,orden=$6 where id=$7 and curso_id=$8", [...vals, lid, curso]);
  else await q("insert into lecciones (titulo,descripcion,youtube_id,material_url,minutos,orden,curso_id) values ($1,$2,$3,$4,$5,$6,$7)", [...vals, curso]);
  back(curso, "?ok=1");
}
async function borrarLeccion(fd) {
  "use server";
  await exigir("equipo");
  const curso = parseInt(fd.get("curso")), lid = parseInt(fd.get("leccion"));
  if (!curso || !lid) redirect("/panel/cursos");
  await q("delete from lecciones where id=$1 and curso_id=$2", [lid, curso]);
  back(curso, "?ok=1");
}

function FormLeccion({ curso, l, orden }) {
  return (
    <form action={guardarLeccion} className="grid2">
      <input type="hidden" name="curso" value={curso} />
      {l && <input type="hidden" name="leccion" value={l.id} />}
      <label className="full" htmlFor={`lt-${l?.id || "n"}`}>Título<input id={`lt-${l?.id || "n"}`} name="titulo" defaultValue={l?.titulo} required /></label>
      <label className="full" htmlFor={`lv-${l?.id || "n"}`}>Video de YouTube<small>Pegá el link del video no listado</small><input id={`lv-${l?.id || "n"}`} name="video" defaultValue={l?.youtube_id ? `https://youtu.be/${l.youtube_id}` : ""} placeholder="https://youtu.be/..." /></label>
      <label className="full" htmlFor={`ld-${l?.id || "n"}`}>Descripción<textarea id={`ld-${l?.id || "n"}`} name="descripcion" defaultValue={l?.descripcion} /></label>
      <label className="full" htmlFor={`lm-${l?.id || "n"}`}>Material (opcional)<small>Link a un PDF o planilla en Drive</small><input id={`lm-${l?.id || "n"}`} name="material" defaultValue={l?.material_url || ""} placeholder="https://drive.google.com/..." /></label>
      <label htmlFor={`lo-${l?.id || "n"}`}>Orden<input id={`lo-${l?.id || "n"}`} name="orden" type="number" min="1" defaultValue={l?.orden || orden} /></label>
      <label htmlFor={`lmin-${l?.id || "n"}`}>Duración (min)<input id={`lmin-${l?.id || "n"}`} name="minutos" type="number" min="1" defaultValue={l?.minutos || ""} /></label>
      <div className="full"><button className="btn small" type="submit">{l ? "Guardar lección" : "Agregar lección"}</button></div>
    </form>
  );
}

export default async function EditarCurso(props) {
  const params = await props.params, searchParams = await props.searchParams;
  const u = await exigir("equipo", `/panel/cursos/${params.id}`);
  const id = parseInt(params.id);
  if (!id) notFound();
  const { rows: [c] } = await q("select * from cursos where id=$1", [id]);
  if (!c) notFound();
  const { rows: ls } = await q("select * from lecciones where curso_id=$1 order by orden,id", [id]);
  const err = { video: "Ese link de YouTube no es válido. Copiá el link del video desde el botón Compartir.", material: "El link del material tiene que empezar con https://" }[searchParams.error];
  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel/cursos" rol={u.rol} />
      <div className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Link href="/panel/cursos">← Todos los cursos</Link>
          {c.publicado && <Link href={`/cursos/${c.slug}`}>Ver como alumno</Link>}
        </div>
        {err && <p className="msg err" role="alert">{err}</p>}
        {searchParams.ok && <p className="msg ok" role="status">Guardado.</p>}
        <form action={guardarCurso} className="panel stack">
          <input type="hidden" name="id" value={c.id} />
          <label htmlFor="ct">Título<input id="ct" name="titulo" defaultValue={c.titulo} required /></label>
          <label htmlFor="cd">Descripción<small>Qué va a aprender el alumno</small><textarea id="cd" name="descripcion" defaultValue={c.descripcion} /></label>
          <div className="row">
            <label className="check" htmlFor="cp"><input id="cp" name="publicado" type="checkbox" defaultChecked={c.publicado} />Publicado (visible en /cursos)</label>
            <label className="check" htmlFor="cg"><input type="hidden" name="gratuito" value="on" /><input id="cg" type="checkbox" checked readOnly disabled />Gratuito (los pagos llegan en la Fase 3)</label>
          </div>
          <div><button className="btn" type="submit">Guardar curso</button></div>
        </form>
        <h2>Lecciones ({ls.length})</h2>
        {ls.map(l => (
          <details key={l.id} className="panel">
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>{l.orden}. {l.titulo} {l.youtube_id ? "" : <span className="pill gray">sin video</span>}</summary>
            <div className="stack" style={{ marginTop: 16 }}>
              <FormLeccion curso={c.id} l={l} />
              <form action={borrarLeccion}><input type="hidden" name="curso" value={c.id} /><input type="hidden" name="leccion" value={l.id} /><button className="btn danger small" type="submit">Borrar lección</button></form>
            </div>
          </details>
        ))}
        <div className="panel stack"><h3>Nueva lección</h3><FormLeccion curso={c.id} orden={ls.length + 1} /></div>
      </div>
    </div>
  );
}
