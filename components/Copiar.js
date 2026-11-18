"use client";
import { useState } from "react";
export default function Copiar({ texto }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn ghost" onClick={async () => {
      try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 2000); } catch {}
    }}>{ok ? "Copiado" : "Copiar código"}</button>
  );
}
