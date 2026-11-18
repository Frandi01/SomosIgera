"use client";
// Calculadora para probar escenarios ("¿y si subo el precio?", "¿y si lleno más horas?").
// Arranca con los datos del negocio; lo que se cambia acá no se guarda.
import { useMemo, useState } from "react";

const fmt = n => (Number.isFinite(n) ? "$" + Math.round(n).toLocaleString("es-AR") : "—");
const num = v => Math.max(0, Number(String(v).replace(/[^\d.]/g, "")) || 0);

export default function Calculadora({ porTiempo, inicial, items, palabras }) {
  const [v, setV] = useState(inicial);
  const set = k => e => setV(s => ({ ...s, [k]: e.target.value }));
  const usar = id => { const it = items.find(i => String(i.id) === id); if (it) setV(s => ({ ...s, nombre: it.nombre, precio: it.precio, costo: it.costo, minutos: it.minutos || s.minutos })); };

  const r = useMemo(() => {
    const fijos = num(v.fijos), precio = num(v.precio), costo = num(v.costo), meta = num(v.margen) / 100;
    if (porTiempo) {
      const horas = Math.max(1, num(v.puestos) * num(v.horas) * Math.max(0.01, Math.min(100, num(v.ocupacion)) / 100));
      const fijoHora = fijos / horas, min = Math.max(1, num(v.minutos)), com = Math.min(0.9, num(v.comision) / 100);
      const base = fijoHora * min / 60 + costo, total = base + precio * com;
      const aporte = precio - costo - precio * com;
      return { total, ganancia: precio - total, sugerido: base * (1 + meta) / (1 - com), fijoHora, equilibrio: aporte > 0 ? fijos / aporte : Infinity, capacidad: horas * 60 / min };
    }
    const aporte = precio - costo;
    return { total: costo, ganancia: aporte, sugerido: costo * (1 + meta) / Math.max(0.1, 1 - meta), equilibrio: aporte > 0 ? fijos / aporte : Infinity, ventasEq: aporte > 0 && precio > 0 ? fijos / (aporte / precio) : Infinity };
  }, [v, porTiempo]);

  const campo = (k, label, extra = {}) => <label htmlFor={`k-${k}`}>{label}<input id={`k-${k}`} inputMode="numeric" value={v[k]} onChange={set(k)} {...extra} /></label>;
  return (
    <div className="calc2">
      <div className="panel stack">
        {items.length > 0 && <label htmlFor="k-item">Partir de un {palabras.item} tuyo<select id="k-item" defaultValue={items[0] ? String(items[0].id) : ""} onChange={e => usar(e.target.value)}><option value="">Elegí uno</option>{items.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}</select></label>}
        <div className="grid2">
          {campo("fijos", "Gastos fijos del mes ($)")}
          {campo("margen", "Margen que querés (%)")}
          {porTiempo && <>{campo("puestos", "Puestos de trabajo")}{campo("horas", "Horas abiertas por mes")}{campo("ocupacion", "Ocupación real (%)")}{campo("comision", "Comisión (%)")}</>}
        </div>
        <h3>{palabras.Item}{v.nombre ? `: ${v.nombre}` : ""}</h3>
        <div className="grid2">
          {campo("precio", "Precio ($)")}
          {campo("costo", `${palabras.costoItem} ($)`)}
          {porTiempo && campo("minutos", "Duración (minutos)")}
        </div>
      </div>
      <div className="panel stack calc2-res" aria-live="polite">
        <span className="muted">Costo real</span>
        <b className="calc2-grande">{fmt(r.total)}</b>
        <div className="calc2-filas">
          <p><span>Te queda por cada uno</span><b style={{ color: r.ganancia < 0 ? "var(--warn)" : "var(--ok)" }}>{fmt(r.ganancia)}</b></p>
          <p><span>Precio sugerido con tu margen</span><b>{fmt(r.sugerido)}</b></p>
          {porTiempo && <p><span>Gastos fijos por hora ocupada</span><b>{fmt(r.fijoHora)}</b></p>}
          <p><span>{porTiempo ? "Servicios al mes para cubrir los fijos" : `Unidades al mes para cubrir los fijos`}</span><b>{Number.isFinite(r.equilibrio) ? Math.ceil(r.equilibrio).toLocaleString("es-AR") : "No se cubren"}</b></p>
          {porTiempo && <p><span>Lo máximo que podés hacer al mes con esa ocupación</span><b>{Math.floor(r.capacidad).toLocaleString("es-AR")}</b></p>}
          {!porTiempo && <p><span>Ventas al mes para cubrir los fijos</span><b>{fmt(r.ventasEq)}</b></p>}
        </div>
        <p className="muted" style={{ fontSize: ".85rem" }}>Es para probar escenarios: lo que cambies acá no se guarda. Tus precios reales se editan en Costos y precios.</p>
      </div>
    </div>
  );
}
