"use client";
// Cargar una venta o un gasto en dos toques: elegir qué (o escribir el monto) y tocar el medio de pago.
import { useState, useTransition } from "react";
import { cargarMovimiento, borrarMovimiento } from "@/app/negocio/acciones";

const fmt = n => "$" + Math.round(n).toLocaleString("es-AR");
const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia", mercadopago: "Mercado Pago", tarjeta: "Tarjeta" };

export default function CargaRapida({ items, medios, categorias, palabraItem }) {
  const [tipo, setTipo] = useState("venta");
  const [item, setItem] = useState(null);
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]);
  const [aviso, setAviso] = useState(null);
  const [pendiente, start] = useTransition();

  const elegir = it => { setItem(it.id === item ? null : it.id); setMonto(it.id === item ? "" : String(it.precio)); };
  const enviar = medio => start(async () => {
    const r = await cargarMovimiento({ tipo, monto, medio, itemId: tipo === "venta" ? item : null, categoria });
    if (!r.ok) { setAviso({ error: r.error }); return; }
    setAviso({ id: r.id, texto: `${tipo === "venta" ? "Venta" : "Gasto"} de ${fmt(Number(String(monto).replace(/\D/g, "")))} ${tipo === "venta" ? "cargada" : "cargado"}.` });
    setItem(null); setMonto("");
  });
  const deshacer = () => start(async () => { await borrarMovimiento(aviso.id); setAviso({ texto: "Listo, lo borré." }); });

  return (
    <div className="panel stack carga">
      <div className="segmento" role="tablist" aria-label="Qué cargás">
        <button type="button" role="tab" aria-selected={tipo === "venta"} onClick={() => { setTipo("venta"); setAviso(null); }}>Venta</button>
        <button type="button" role="tab" aria-selected={tipo === "gasto"} onClick={() => { setTipo("gasto"); setItem(null); setMonto(""); setAviso(null); }}>Gasto</button>
      </div>
      {tipo === "venta" && items.length > 0 && (
        <div className="chips" aria-label={`Elegí el ${palabraItem}`}>{items.map(it => (
          <button key={it.id} type="button" className="chip" aria-pressed={item === it.id} onClick={() => elegir(it)}><b>{it.nombre}</b><span>{fmt(it.precio)}</span></button>
        ))}</div>
      )}
      {tipo === "gasto" && (
        <div className="chips">{categorias.map(c => <button key={c} type="button" className="chip" aria-pressed={categoria === c} onClick={() => setCategoria(c)}><b>{c}</b></button>)}</div>
      )}
      <label htmlFor="cr-monto">Monto
        <input id="cr-monto" inputMode="numeric" autoComplete="off" placeholder="$ 0" value={monto} onChange={e => { setMonto(e.target.value.replace(/[^\d]/g, "")); setItem(null); }} />
      </label>
      <div className="medios">
        <span className="muted">{tipo === "venta" ? "¿Cómo te pagaron?" : "¿Cómo pagaste?"}</span>
        <div className="row">{medios.map(m => <button key={m} type="button" className="button medio" disabled={pendiente || !monto} onClick={() => enviar(m)}>{MEDIOS[m] || m}</button>)}</div>
      </div>
      {aviso && <p className={`msg ${aviso.error ? "err" : "ok"} row`} role="status" style={{ justifyContent: "space-between" }}>
        <span>{aviso.error || aviso.texto}</span>{aviso.id && <button type="button" className="linkbtn" onClick={deshacer} disabled={pendiente}>Deshacer</button>}
      </p>}
    </div>
  );
}
