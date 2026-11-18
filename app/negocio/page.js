import Link from "next/link";
import { q } from "@/lib/db";
import { exigirNegocio, resumen, hoyAR } from "@/lib/negocio";
import { plantilla, pesos, MEDIOS } from "@/lib/plantillas";
import NegocioTabs from "@/components/NegocioTabs";
import CargaRapida from "@/components/CargaRapida";
import BorrarMovimiento from "@/components/BorrarMovimiento";

export const metadata = { title: "Mi negocio" };
export const dynamic = "force-dynamic";

const PRIMERO = { ganancia: "mes", precios: "precios", caja: "caja", stock: "mes" };

export default async function Hoy() {
  const { u, n } = await exigirNegocio("/negocio");
  const p = plantilla(n.plantilla);
  const hoy = hoyAR();
  const [r, { rows: items }, { rows: ultimos }] = await Promise.all([
    resumen(u.id, hoy),
    q("select id,nombre,precio from items where usuario_id=$1 and activo order by nombre", [u.id]),
    q("select id,fecha,tipo,monto,medio,categoria,detalle from movimientos where usuario_id=$1 order by fecha desc, id desc limit 8", [u.id]),
  ]);
  const avance = r.necesario > 0 ? Math.min(1, r.ventasMes / r.necesario) : r.ventasMes > 0 ? 1 : 0;
  const mesNombre = new Date(hoy + "T12:00:00").toLocaleDateString("es-AR", { month: "long" });

  const bloqueCaja = (
    <div className="panel stack" key="caja">
      <h2>Caja de hoy</h2>
      <div className="kpis">
        <div className="kpi"><span className="muted">Vendiste</span><b>{pesos(r.dia.ventas)}</b></div>
        <div className="kpi"><span className="muted">Gastaste</span><b>{pesos(r.dia.gastos)}</b></div>
      </div>
      {r.dia.porMedio.length > 0 && <p className="muted">{r.dia.porMedio.map(m => `${MEDIOS[m.medio] || "Sin medio"}: ${pesos(m.t)}`).join(" · ")}</p>}
    </div>
  );
  const bloqueMes = (
    <div className="panel stack" key="mes">
      <h2>¿Cubrís el mes de {mesNombre}?</h2>
      {r.fijos === 0 && !r.hayMovimientos ? (
        <p className="muted">Cargá tus gastos fijos en <Link href="/negocio/costos">Costos y precios</Link> y tus ventas de cada día para ver cuánto te falta para cubrir el mes.</p>
      ) : (<>
        <div className="equilibrio" role="img" aria-label={`Vendiste ${pesos(r.ventasMes)} de ${pesos(r.necesario)} que necesitás`}>
          <span style={{ width: `${Math.round(avance * 100)}%` }} className={r.ganancia >= 0 ? "ok" : ""} />
        </div>
        <p><b>{pesos(r.ventasMes)}</b> vendidos de <b>{pesos(r.necesario)}</b> que necesitás para cubrir gastos{r.fijosPendientes > 0 ? ` (incluye ${pesos(r.fijosPendientes)} de gastos fijos que todavía no cargaste como pagados)` : ""}.</p>
        <p className={r.ganancia >= 0 ? "estado ok" : "estado"}>{r.ganancia >= 0 ? `Ya cubriste el mes: vas ganando ${pesos(r.ganancia)}.` : `Te faltan ${pesos(-r.ganancia)} para cubrir el mes.`}</p>
        {r.diasConDatos >= 3 && r.ventasMes > 0 && r.dia_del_mes < r.diasMes && <p className="muted">Proyección: al ritmo de estos {r.diasConDatos} días, cerrás {mesNombre} con {pesos(r.proyVentas)} de ventas y {r.proyGanancia >= 0 ? `una ganancia de ${pesos(r.proyGanancia)}` : `una pérdida de ${pesos(-r.proyGanancia)}`}.</p>}
      </>)}
    </div>
  );
  const bloquePrecios = (
    <div className="panel stack" key="precios">
      <h2>Tus precios</h2>
      <p className="muted">Revisá cuánto te cuesta cada {p.item} y cuánto deberías cobrar con el margen que querés.</p>
      <div><Link className="btn ghost small" href="/negocio/costos">Ver costos y precios</Link></div>
    </div>
  );
  const orden = PRIMERO[n.prioridad] === "precios" ? [bloquePrecios, bloqueMes, bloqueCaja] : PRIMERO[n.prioridad] === "caja" ? [bloqueCaja, bloqueMes] : [bloqueMes, bloqueCaja];

  return (
    <div className="wrap section stack">
      <NegocioTabs nombre={n.nombre} titulo="Hoy" />
      <div className="negocio-grid">
        <div className="stack">
          <CargaRapida items={items.map(i => ({ id: i.id, nombre: i.nombre, precio: Number(i.precio) }))} medios={n.medios} categorias={p.categoriasGasto} palabraItem={p.item} />
          <div className="panel stack">
            <div className="row" style={{ justifyContent: "space-between" }}><h2>Últimos movimientos</h2><Link href="/negocio/movimientos" className="muted">Ver todos</Link></div>
            {ultimos.length === 0 ? <p className="muted">Todavía no cargaste nada. Empezá con la venta de hoy.</p> : (
              <ul className="movs">{ultimos.map(m => (
                <li key={m.id}>
                  <span><b>{m.detalle || m.categoria || (m.tipo === "venta" ? "Venta" : "Gasto")}</b><small className="muted">{m.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })}{m.medio ? ` · ${MEDIOS[m.medio]}` : ""}</small></span>
                  <span className={m.tipo === "venta" ? "monto venta" : "monto gasto"}>{m.tipo === "venta" ? "+" : "−"}{pesos(m.monto)}</span>
                  <BorrarMovimiento id={String(m.id)} />
                </li>))}
              </ul>)}
          </div>
        </div>
        <div className="stack">{orden}</div>
      </div>
    </div>
  );
}
