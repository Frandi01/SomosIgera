"use client";
import { useState, useTransition } from "react";
import { borrarMovimiento } from "@/app/negocio/acciones";
// Borrado en dos toques (sin diálogos del navegador): primero "Borrar", después "¿Seguro?".
export default function BorrarMovimiento({ id }) {
  const [seguro, setSeguro] = useState(false);
  const [pend, start] = useTransition();
  if (!seguro) return <button type="button" className="linkbtn quitar" aria-label="Borrar movimiento" onClick={() => setSeguro(true)}>×</button>;
  return <button type="button" className="linkbtn quitar si" disabled={pend} onClick={() => start(async () => { await borrarMovimiento(id); })} onBlur={() => setSeguro(false)} autoFocus>¿Borrar?</button>;
}
