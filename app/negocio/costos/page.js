import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import { exigirNegocio, fijosMes, entero, texto } from "@/lib/negocio";
import { plantilla, pesos, costear } from "@/lib/plantillas";
import NegocioTabs from "@/components/NegocioTabs";

export const metadata = { title: "Costos y precios" };
export const dynamic = "force-dynamic";

const ir = (m = "") => { revalidatePath("/negocio"); redirect(`/negocio/costos${m}`); };
const yo = () => exigir("negocio", "update", "/negocio/costos");

async function agregarFijo(fd) {
  "use server";
  const u = await yo();
  const nombre = texto(fd.get("nombre")), monto = entero(fd.get("monto"));
  if (!nombre) ir("?error=nombre#fijos");
  const { rows } = await q("select count(*)::int n from gastos_fijos where usuario_id=$1", [u.id]);
  if (rows[0].n >= 60) ir("?error=limite#fijos");
  await q("insert into gastos_fijos (usuario_id,nombre,monto) values ($1,$2,$3)", [u.id, nombre, monto]);
  ir("#fijos");
}
async function editarFijo(fd) {
  "use server";
  const u = await yo();
  const id = parseInt(fd.get("id")) || 0;
  if (fd.get("borrar")) await q("delete from gastos_fijos where id=$1 and usuario_id=$2", [id, u.id]);
  else await q("update gastos_fijos set nombre=$1, monto=$2 where id=$3 and usuario_id=$4", [texto(fd.get("nombre")) || "Gasto", entero(fd.get("monto")), id, u.id]);
  ir("#fijos");
}
async function guardarCapacidad(fd) {
  "use server";
  const u = await yo();
  const r = (k, lo, hi, def) => Math.min(hi, Math.max(lo, parseInt(fd.get(k)) || def));
  await q("update negocios set puestos=$1, horas_mes=$2, ocupacion=$3, comision=$4, margen_objetivo=$5 where usuario_id=$6",
    [r("puestos", 1, 500, 1), r("horas_mes", 1, 744, 200), r("ocupacion", 1, 100, 60), r("comision", 0, 90, 0), r("margen", 0, 300, 35), u.id]);
  ir("?ok=capacidad#capacidad");
}
async function agregarItem(fd) {
  "use server";
  const u = await yo();
  const nombre = texto(fd.get("nombre"));
  if (!nombre) ir("?error=nombre#items");
  const { rows } = await q("select count(*)::int n from items where usuario_id=$1", [u.id]);
  if (rows[0].n >= 300) ir("?error=limite#items");
  await q("insert into items (usuario_id,nombre,precio,costo,minutos) values ($1,$2,$3,$4,$5)",
    [u.id, nombre, entero(fd.get("precio")), entero(fd.get("costo")), parseInt(fd.get("minutos")) || null]);
  ir("#items");
}
async function editarItem(fd) {
  "use server";
  const u = await yo();
  const id = parseInt(fd.get("id")) || 0;
  if (fd.get("borrar")) await q("delete from items where id=$1 and usuario_id=$2", [id, u.id]);
  else await q("update items set nombre=$1, precio=$2, costo=$3, minutos=$4 where id=$5 and usuario_id=$6",
    [texto(fd.get("nombre")) || "Sin nombre", entero(fd.get("precio")), entero(fd.get("costo")), parseInt(fd.get("minutos")) || null, id, u.id]);
  ir("#items");
}

const SUGERIDOS = ["Alquiler", "Luz, agua y gas", "Internet y teléfono", "Sueldos", "Monotributo o impuestos", "Software y suscripciones", "Publicidad"];
const ERR = { nombre: "Poné un nombre.", limite: "Llegaste al máximo de filas para esta sección." };

export default async function Costos(props) {
  const sp = await props.searchParams;
  const { u, n } = await exigirNegocio("/negocio/costos");
  const p = plantilla(n.plantilla);
  const [{ rows: fijos }, { rows: items }, total] = await Promise.all([
    q("select id,nombre,monto from gastos_fijos where usuario_id=$1 order by id", [u.id]),
    q("select id,nombre,precio,costo,minutos from items where usuario_id=$1 order by nombre", [u.id]),
    fijosMes(u.id),
  ]);
  const pct = x => `${Math.round(x * 100)}%`;
  return (
    <div className="wrap section stack">
      <NegocioTabs nombre={n.nombre} titulo="Costos y precios" />
      {sp.bienvenida && <p className="msg ok" role="status">Tu panel está listo. Paso 2 de 2: cargá tus gastos fijos del mes y revisá los {p.items} de ejemplo (cambialos por los tuyos). Después, en Hoy, cargás cada venta.</p>}
      {sp.error && <p className="msg err" role="alert">{ERR[sp.error]}</p>}
      {sp.ok === "capacidad" && <p className="msg ok" role="status">Guardado.</p>}

      <section className="panel stack" id="fijos">
        <div className="row" style={{ justifyContent: "space-between" }}><h2>Gastos fijos del mes</h2><b className="monto">{pesos(total)}</b></div>
        <p className="muted">Lo que pagás todos los meses vendas o no: alquiler, servicios, sueldos, impuestos.</p>
        {fijos.map(f => (
          <form key={f.id} action={editarFijo} className="fila-edit">
            <input type="hidden" name="id" value={f.id} />
            <input name="nombre" defaultValue={f.nombre} aria-label="Nombre del gasto" maxLength={120} />
            <input name="monto" defaultValue={Number(f.monto)} inputMode="numeric" aria-label={`Monto de ${f.nombre}`} />
            <button className="btn ghost small" type="submit">Guardar</button>
            <button className="linkbtn quitar" name="borrar" value="1" type="submit" aria-label={`Borrar ${f.nombre}`}>×</button>
          </form>))}
        <form action={agregarFijo} className="fila-edit nueva">
          <input name="nombre" list="sug-fijos" placeholder="Ej: Alquiler" aria-label="Nombre del gasto nuevo" maxLength={120} required />
          <input name="monto" inputMode="numeric" placeholder="$ por mes" aria-label="Monto por mes" />
          <button className="button" type="submit">Agregar</button>
          <datalist id="sug-fijos">{SUGERIDOS.map(s => <option key={s} value={s} />)}</datalist>
        </form>
      </section>

      <section className="panel stack" id="capacidad">
        <h2>{p.usaTiempo ? "Capacidad y margen" : "Margen que querés"}</h2>
        <form action={guardarCapacidad} className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
          {p.usaTiempo ? (<>
            <label htmlFor="c-puestos">{p.capacidad}<input id="c-puestos" name="puestos" type="number" min={1} max={500} defaultValue={n.puestos} /></label>
            <label htmlFor="c-horas">Horas abiertas por mes<small>ej: 9 h × 24 días = 216</small><input id="c-horas" name="horas_mes" type="number" min={1} max={744} defaultValue={n.horas_mes} /></label>
            <label htmlFor="c-ocup">Ocupación real (%)<small>qué parte de esas horas tenés clientes</small><input id="c-ocup" name="ocupacion" type="number" min={1} max={100} defaultValue={n.ocupacion} /></label>
            <label htmlFor="c-com">Comisión al profesional (%)<input id="c-com" name="comision" type="number" min={0} max={90} defaultValue={n.comision} /></label>
          </>) : (<>
            <input type="hidden" name="puestos" value={n.puestos} /><input type="hidden" name="horas_mes" value={n.horas_mes} /><input type="hidden" name="ocupacion" value={n.ocupacion} /><input type="hidden" name="comision" value={n.comision} />
          </>)}
          <label htmlFor="c-margen">Margen que querés (%)<input id="c-margen" name="margen" type="number" min={0} max={300} defaultValue={n.margen_objetivo} /></label>
          <div className="full"><button className="btn ghost small" type="submit">Guardar</button></div>
        </form>
      </section>

      <section className="panel stack" id="items">
        <h2>{p.Items}: costo y precio</h2>
        <p className="muted">{p.usaTiempo ? "El costo suma los insumos, la parte de tus gastos fijos que le toca a ese tiempo y la comisión." : `El costo es el ${p.costoItem.toLowerCase()}. Tus gastos fijos se cubren con lo que te queda de cada venta.`}</p>
        <div className="items-lista">{items.map(it => {
          const c = costear(it, n, total);
          return (
            <form key={it.id} action={editarItem} className="item-card">
              <input type="hidden" name="id" value={it.id} />
              <label className="item-nombre">Nombre<input name="nombre" defaultValue={it.nombre} maxLength={120} /></label>
              <label>Precio<input name="precio" defaultValue={Number(it.precio)} inputMode="numeric" /></label>
              <label>{p.costoItem}<input name="costo" defaultValue={Number(it.costo)} inputMode="numeric" /></label>
              {p.usaTiempo && <label>Minutos<input name="minutos" type="number" min={0} max={1440} defaultValue={it.minutos || ""} /></label>}
              <p className="item-resultado">
                <span>Costo total <b>{pesos(c.total)}</b></span>
                <span>Te queda <b style={{ color: c.ganancia < 0 ? "var(--warn)" : "var(--ok)" }}>{pesos(c.ganancia)} ({pct(c.margen)})</b></span>
                <span>Precio sugerido <b>{pesos(c.sugerido)}</b></span>
              </p>
              <div className="row item-acciones"><button className="btn ghost small" type="submit">Guardar</button><button className="linkbtn quitar" name="borrar" value="1" type="submit" aria-label={`Borrar ${it.nombre}`}>Borrar</button></div>
            </form>);
        })}</div>
        <form action={agregarItem} className="fila-edit nueva item-nuevo">
          <input name="nombre" placeholder={`Nuevo ${p.item}`} aria-label={`Nombre del ${p.item}`} maxLength={120} required />
          <input name="precio" inputMode="numeric" placeholder="Precio" aria-label="Precio" />
          <input name="costo" inputMode="numeric" placeholder={p.costoItem} aria-label={p.costoItem} />
          {p.usaTiempo && <input name="minutos" type="number" min={0} max={1440} placeholder="Minutos" aria-label="Minutos" />}
          <button className="button" type="submit">Agregar</button>
        </form>
        {p.usaTiempo && total > 0 && <p className="muted">Cada hora con clientes te cuesta {pesos(costear({ precio: 0, costo: 0, minutos: 60 }, n, total).fijoHora)} de gastos fijos.</p>}
      </section>
    </div>
  );
}
