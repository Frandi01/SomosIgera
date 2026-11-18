import Link from "next/link";
import { redirect } from "next/navigation";
import { q } from "@/lib/db";
import { exigirNegocio, hoyAR } from "@/lib/negocio";
import { plantilla, pesos, MEDIOS } from "@/lib/plantillas";
import { cargarMovimiento } from "@/app/negocio/acciones";
import NegocioTabs from "@/components/NegocioTabs";
import BorrarMovimiento from "@/components/BorrarMovimiento";

export const metadata = { title: "Movimientos" };
export const dynamic = "force-dynamic";

async function cargarConFecha(fd) {
  "use server";
  const r = await cargarMovimiento({ tipo: fd.get("tipo"), monto: fd.get("monto"), medio: fd.get("medio"), fecha: fd.get("fecha"), detalle: fd.get("detalle"), categoria: fd.get("categoria") });
  const mes = String(fd.get("fecha") || "").slice(0, 7);
  redirect(`/negocio/movimientos?mes=${/^\d{4}-\d{2}$/.test(mes) ? mes : ""}${r.ok ? "" : "&error=1"}`);
}

const nombreMes = m => new Date(m + "-15T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" });
const mover = (m, d) => { const [y, mo] = m.split("-").map(Number); const t = new Date(Date.UTC(y, mo - 1 + d, 1)); return t.toISOString().slice(0, 7); };

export default async function Movimientos(props) {
  const sp = await props.searchParams;
  const { u, n } = await exigirNegocio("/negocio/movimientos");
  const p = plantilla(n.plantilla);
  const hoy = hoyAR();
  const mes = /^\d{4}-\d{2}$/.test(sp.mes || "") ? sp.mes : hoy.slice(0, 7);
  const { rows } = await q(
    `select id,fecha,tipo,monto,medio,categoria,detalle from movimientos
     where usuario_id=$1 and to_char(fecha,'YYYY-MM')=$2 order by fecha desc, id desc limit 2000`, [u.id, mes]);
  const ventas = rows.filter(r => r.tipo === "venta"), gastos = rows.filter(r => r.tipo === "gasto");
  const suma = a => a.reduce((t, r) => t + Number(r.monto), 0);
  const agrupar = (a, k) => Object.entries(a.reduce((m, r) => (m[r[k] || "—"] = (m[r[k] || "—"] || 0) + Number(r.monto), m), {})).sort((x, y) => y[1] - x[1]);
  return (
    <div className="wrap section stack">
      <NegocioTabs actual="/negocio/movimientos" nombre={n.nombre} plantilla={p.nombre} />
      {sp.error && <p className="msg err" role="alert">No se pudo cargar: revisá el monto.</p>}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row"><Link className="btn ghost small" href={`?mes=${mover(mes, -1)}`} aria-label="Mes anterior">←</Link><h2 style={{ textTransform: "capitalize" }}>{nombreMes(mes)}</h2>{mes < hoy.slice(0, 7) && <Link className="btn ghost small" href={`?mes=${mover(mes, 1)}`} aria-label="Mes siguiente">→</Link>}</div>
        <a className="btn ghost small" href={`/negocio/csv?mes=${mes}`}>Descargar CSV</a>
      </div>
      <div className="kpis">
        <div className="panel kpi"><span className="muted">Ventas</span><b>{pesos(suma(ventas))}</b><span className="muted">{ventas.length} cargadas</span></div>
        <div className="panel kpi"><span className="muted">Gastos</span><b>{pesos(suma(gastos))}</b><span className="muted">{gastos.length} cargados</span></div>
        <div className="panel kpi"><span className="muted">Resultado</span><b style={{ color: suma(ventas) - suma(gastos) < 0 ? "var(--warn)" : "var(--ok)" }}>{pesos(suma(ventas) - suma(gastos))}</b><span className="muted">ventas menos gastos cargados</span></div>
      </div>
      {rows.length > 0 && (
        <div className="grid2">
          <div className="panel stack"><h3>Ventas por {p.item}</h3>{agrupar(ventas, "detalle").slice(0, 8).map(([k, v]) => <p key={k} className="row" style={{ justifyContent: "space-between" }}><span>{k}</span><b className="monto">{pesos(v)}</b></p>)}</div>
          <div className="panel stack"><h3>Ventas por medio de pago</h3>{agrupar(ventas, "medio").map(([k, v]) => <p key={k} className="row" style={{ justifyContent: "space-between" }}><span>{MEDIOS[k] || "Sin medio"}</span><b className="monto">{pesos(v)}</b></p>)}</div>
        </div>
      )}
      <details className="panel">
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>Cargar un movimiento de otro día</summary>
        <form action={cargarConFecha} className="grid2" style={{ marginTop: 14, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          <label htmlFor="m-fecha">Fecha<input id="m-fecha" name="fecha" type="date" max={hoy} defaultValue={hoy} required /></label>
          <label htmlFor="m-tipo">Tipo<select id="m-tipo" name="tipo"><option value="venta">Venta</option><option value="gasto">Gasto</option></select></label>
          <label htmlFor="m-monto">Monto<input id="m-monto" name="monto" inputMode="numeric" required /></label>
          <label htmlFor="m-medio">Medio<select id="m-medio" name="medio">{n.medios.map(m => <option key={m} value={m}>{MEDIOS[m]}</option>)}</select></label>
          <label htmlFor="m-cat">Categoría (gastos)<select id="m-cat" name="categoria">{p.categoriasGasto.map(c => <option key={c}>{c}</option>)}</select></label>
          <label htmlFor="m-det">Detalle<input id="m-det" name="detalle" maxLength={120} /></label>
          <div className="full"><button className="button" type="submit">Cargar</button></div>
        </form>
      </details>
      <div className="panel">
        {rows.length === 0 ? <p className="muted">No hay movimientos en este mes.</p> : (
          <ul className="movs">{rows.map(m => (
            <li key={m.id}>
              <span><b>{m.detalle || m.categoria || (m.tipo === "venta" ? "Venta" : "Gasto")}</b><small className="muted">{m.fecha.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" })}{m.medio ? ` · ${MEDIOS[m.medio]}` : ""}{m.tipo === "gasto" && m.categoria ? ` · ${m.categoria}` : ""}</small></span>
              <span className={m.tipo === "venta" ? "monto venta" : "monto gasto"}>{m.tipo === "venta" ? "+" : "−"}{pesos(m.monto)}</span>
              <BorrarMovimiento id={String(m.id)} />
            </li>))}
          </ul>)}
      </div>
    </div>
  );
}
