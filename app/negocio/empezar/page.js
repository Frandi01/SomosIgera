import { redirect } from "next/navigation";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import { elegirPlantilla, plantilla, MEDIOS } from "@/lib/plantillas";
import { texto } from "@/lib/negocio";
import Pasos from "@/components/Pasos";

export const metadata = { title: "Contanos de tu negocio" };
export const dynamic = "force-dynamic";

const VENDE = [["servicios", "Servicios", "cortes, tratamientos, reparaciones, clases"], ["fabrico", "Productos que hago yo", "comida, ropa, artesanías"], ["revendo", "Productos que compro y revendo", "almacén, kiosco, indumentaria"], ["mezcla", "Un poco de todo", "servicios y productos"]];
const RUBROS = [["belleza", "Peluquería, barbería o estética"], ["gastronomia", "Gastronomía"], ["comercio", "Comercio"], ["oficio", "Oficio o profesión"], ["otro", "Otro"]];
const LOCAL = [["alquilado", "Sí, alquilado"], ["propio", "Sí, propio"], ["no", "No, trabajo a domicilio o desde casa"]];
const PRIORIDAD = [["ganancia", "Saber si gano plata"], ["precios", "Poner bien los precios"], ["caja", "Ordenar la caja"], ["stock", "Controlar compras y stock"]];

async function guardar(fd) {
  "use server";
  const u = await exigir("negocio", "update", "/negocio/empezar");
  const uno = (k, lista) => (lista.some(([v]) => v === fd.get(k)) ? fd.get(k) : null);
  const queVende = uno("vende", VENDE), rubro = uno("rubro", RUBROS), local = uno("local", LOCAL), prioridad = uno("prioridad", PRIORIDAD);
  const medios = fd.getAll("medios").filter(m => m in MEDIOS);
  const personas = Math.min(500, Math.max(1, parseInt(fd.get("personas")) || 1));
  if (!queVende || !rubro || !local || !prioridad || medios.length === 0) redirect("/negocio/empezar?error=1");
  const clave = elegirPlantilla(queVende, rubro);
  await q(
    `insert into negocios (usuario_id,nombre,plantilla,rubro,que_vende,personas,local,medios,prioridad,puestos)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (usuario_id) do update set nombre=excluded.nombre, plantilla=excluded.plantilla, rubro=excluded.rubro,
       que_vende=excluded.que_vende, personas=excluded.personas, local=excluded.local, medios=excluded.medios, prioridad=excluded.prioridad`,
    [u.id, texto(fd.get("nombre")), clave, rubro, queVende, personas, local, medios, prioridad, Math.min(personas, 50)]);
  // Primer uso: se cargan ejemplos editables para que el panel no arranque vacío.
  const { rows } = await q("select count(*)::int n from items where usuario_id=$1", [u.id]);
  if (rows[0].n === 0) for (const e of plantilla(clave).ejemplos)
    await q("insert into items (usuario_id,nombre,precio,costo,minutos) values ($1,$2,$3,$4,$5)", [u.id, e.nombre, e.precio, e.costo, e.minutos || null]);
  redirect("/negocio/costos?bienvenida=1");
}

const Opciones = ({ name, lista, tipo = "radio", marcados = [] }) => (
  <div className="opciones-lista">{lista.map(([v, t, s]) => (
    <label key={v} className="opcion"><input type={tipo} name={name} value={v} defaultChecked={marcados.includes(v)} /><span><b>{t}</b>{s && <small>{s}</small>}</span></label>
  ))}</div>
);

export default async function Empezar(props) {
  const sp = await props.searchParams;
  const u = await exigir("negocio", "view", "/negocio/empezar");
  const { rows: [n] } = await q("select * from negocios where usuario_id=$1", [u.id]);
  return (
    <div className="wrap narrow section stack">
      <p className="eyebrow">Un minuto y listo</p>
      <h1>Contanos de <em>tu negocio.</em></h1>
      <p className="muted">Con 7 preguntas cortas armamos tu panel. Lo podés cambiar cuando quieras.</p>
      {sp.error && <p className="msg err" role="alert">Respondé todas las preguntas y elegí al menos un medio de pago.</p>}
      <form action={guardar} className="panel">
        <Pasos enviar={n ? "Guardar cambios" : "Armar mi panel"}>
          <fieldset className="pregunta"><legend>¿Qué vendés?</legend><Opciones name="vende" lista={VENDE} marcados={[n?.que_vende]} /></fieldset>
          <fieldset className="pregunta"><legend>¿De qué rubro?</legend><Opciones name="rubro" lista={RUBROS} marcados={[n?.rubro]} /></fieldset>
          <label htmlFor="n-personas" className="pregunta-texto">¿Cuántas personas trabajan, contándote?<input id="n-personas" name="personas" type="number" min={1} max={500} defaultValue={n?.personas || 1} style={{ maxWidth: 160 }} /></label>
          <fieldset className="pregunta"><legend>¿Tenés local?</legend><Opciones name="local" lista={LOCAL} marcados={[n?.local]} /></fieldset>
          <fieldset className="pregunta"><legend>¿Cómo te pagan?</legend><p className="muted" style={{ marginBottom: 10 }}>Podés elegir varios.</p><Opciones name="medios" tipo="checkbox" lista={Object.entries(MEDIOS).map(([v, t]) => [v, t])} marcados={n?.medios || ["efectivo", "transferencia"]} /></fieldset>
          <fieldset className="pregunta"><legend>¿Qué querés resolver primero?</legend><Opciones name="prioridad" lista={PRIORIDAD} marcados={[n?.prioridad]} /></fieldset>
          <label htmlFor="n-nombre" className="pregunta-texto">¿Cómo se llama tu negocio?<small>Opcional. Es el título de tu panel.</small><input id="n-nombre" name="nombre" maxLength={120} defaultValue={n?.nombre || ""} /></label>
        </Pasos>
      </form>
    </div>
  );
}
