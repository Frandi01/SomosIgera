"use client";
// Formulario de a una pregunta por vez. Las respuestas ya elegidas avanzan solas; las de varias
// opciones o texto usan "Siguiente". Los pasos ocultos siguen dentro del form, así se envía todo junto.
import { Children, useRef, useState } from "react";

export default function Pasos({ children, enviar }) {
  const pasos = Children.toArray(children);
  const [i, setI] = useState(0);
  const [error, setError] = useState(null);
  const caja = useRef(null);
  const ultimo = i === pasos.length - 1;

  const respondido = n => {
    const paso = caja.current?.querySelectorAll("[data-paso]")[n];
    if (!paso) return true;
    const grupos = new Set([...paso.querySelectorAll("input[type=radio],input[type=checkbox]")].map(x => x.name));
    for (const g of grupos) if (!paso.querySelector(`input[name="${g}"]:checked`)) return false;
    return true;
  };
  const ir = n => {
    if (n > i && !respondido(i)) { setError("Elegí una opción para seguir."); return; }
    setError(null);
    setI(Math.max(0, Math.min(pasos.length - 1, n)));
    requestAnimationFrame(() => caja.current?.querySelectorAll("[data-paso]")[n]?.querySelector("input[type=number],input:not([type])")?.focus({ preventScroll: true }));
  };
  const alCambiar = e => {
    if (e.target.type === "radio" && !ultimo) setTimeout(() => ir(i + 1), 220);
  };

  return (
    <div ref={caja} className="pasos" onChange={alCambiar}
      onKeyDown={e => { if (e.key === "Enter" && !ultimo && e.target.tagName === "INPUT") { e.preventDefault(); ir(i + 1); } }}>
      <div className="pasos-barra" aria-hidden="true"><span style={{ width: `${Math.round(100 * (i + 1) / pasos.length)}%` }} /></div>
      <p className="muted pasos-cuenta">Pregunta {i + 1} de {pasos.length}</p>
      {pasos.map((p, n) => <div key={n} data-paso hidden={n !== i} className="paso">{p}</div>)}
      {error && <p className="msg err" role="alert">{error}</p>}
      <div className="row pasos-nav">
        {i > 0 ? <button type="button" className="btn ghost small" onClick={() => ir(i - 1)}>← Atrás</button> : <span />}
        {ultimo ? <button className="button" type="submit">{enviar}</button> : <button type="button" className="button" onClick={() => ir(i + 1)}>Siguiente</button>}
      </div>
    </div>
  );
}
