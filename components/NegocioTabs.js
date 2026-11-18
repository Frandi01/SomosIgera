import Link from "next/link";
const TABS = [["/negocio", "Hoy"], ["/negocio/costos", "Costos y precios"], ["/negocio/movimientos", "Movimientos"], ["/calculadora", "Calculadora"]];
export default function NegocioTabs({ actual, nombre, plantilla }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 className="negocio-titulo">{nombre || "Mi negocio"}</h1>
        <Link className="muted" href="/negocio/empezar" style={{ fontSize: ".85rem" }}>{plantilla} · cambiar</Link>
      </div>
      <nav className="tabs negocio-tabs" aria-label="Secciones de mi negocio">{TABS.map(([h, t]) => h.startsWith("/negocio")
        ? <Link key={h} href={h} aria-current={actual === h ? "page" : undefined}>{t}</Link>
        : <a key={h} href={h}>{t}</a>)}</nav>
    </div>
  );
}
