"use client";
// Navegación única según dónde está la persona:
// - Sitio público (jornada, ingresar, registro, encuesta): La jornada · Ingresar/Mi negocio · Inscribirme.
// - Su negocio (/negocio, /cuenta): las secciones del negocio arriba en compu y abajo en el celular,
//   más el menú de la cuenta. Sin "Inscribirme" ni pie de página: es una herramienta de trabajo.
// - Gestión (/panel, /cursos): el menú de la cuenta; las pestañas del panel están en cada página.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SECCIONES = [
  ["/negocio", "Hoy", "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"],
  ["/negocio/costos", "Costos y precios", "M4 19h16M7 16V9m5 7V5m5 11v-4"],
  ["/negocio/movimientos", "Movimientos", "M4 7h16M4 12h16M4 17h10"],
  ["/negocio/calculadora", "Calculadora", "M6 3h12v18H6zM9 7h6M9 11h1m2 0h1m2 0h0M9 15h1m2 0h1m2 0h0"],
];
const esApp = p => /^\/(negocio|cuenta|panel|cursos)(\/|$)/.test(p);
const enNegocio = p => (/^\/negocio(\/|$)/.test(p) && p !== "/negocio/empezar") || p === "/cuenta";
const activa = (p, h) => (h === "/negocio" ? p === "/negocio" : p.startsWith(h));

function MenuCuenta({ u }) {
  return (
    <details className="menu-cuenta">
      <summary aria-label="Tu cuenta"><span className="avatar" aria-hidden="true">{u.nombre.trim().charAt(0).toUpperCase()}</span><span className="menu-cuenta-nombre">{u.nombre.split(" ")[0]}</span></summary>
      <nav aria-label="Tu cuenta">
        <Link href="/negocio">Mi negocio</Link>
        {u.panel && <Link href={u.panel}>Panel de gestión</Link>}
        <Link href="/negocio/empezar">Datos del negocio</Link>
        <Link href="/cuenta">Mi cuenta y contraseña</Link>
        <a href="/">Sitio de la jornada</a>
        <form action="/salir" method="post"><button className="linkbtn" type="submit">Salir</button></form>
      </nav>
    </details>
  );
}

export function Encabezado({ u }) {
  const p = usePathname() || "/";
  if (u && esApp(p)) {
    const secciones = enNegocio(p);
    return (<>
      <header className="site-header app-header"><div className="wrap header-inner">
        <Link className="brand" href="/negocio" aria-label="Mi negocio"><img className="brand-logo" src="/marca/logo-color.png" width={560} height={169} alt="" /></Link>
        {secciones && <nav className="desktop-nav app-nav" aria-label="Secciones de mi negocio">{SECCIONES.map(([h, t]) => <Link key={h} href={h} aria-current={activa(p, h) ? "page" : undefined}>{t}</Link>)}</nav>}
        {!secciones && p.startsWith("/panel") && <span className="app-contexto">Panel de gestión</span>}
        <div className="header-actions"><MenuCuenta u={u} /></div>
      </div></header>
      {secciones && (
        <nav className="barra-inferior" aria-label="Secciones de mi negocio">{SECCIONES.map(([h, t, d]) => (
          <Link key={h} href={h} aria-current={activa(p, h) ? "page" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg><span>{t === "Costos y precios" ? "Costos" : t}</span>
          </Link>))}
        </nav>
      )}
    </>);
  }
  const links = (<>
    <a href="/">La jornada</a>
    {u ? <Link href="/negocio">Mi negocio</Link> : <Link href="/ingresar">Ingresar</Link>}
  </>);
  return (
    <header className="site-header"><div className="wrap header-inner">
      <Link className="brand" href="/" aria-label="Somos Igera, inicio"><img className="brand-logo" src="/marca/logo-color.png" width={560} height={169} alt="" /></Link>
      <nav className="desktop-nav" aria-label="Navegación principal">{links}</nav>
      <div className="header-actions">
        <a className="button button-small" href="/#inscripcion">Inscribirme <span aria-hidden="true">↗</span></a>
        <details className="mobile-nav">
          <summary aria-label="Menú"><span></span><span></span></summary>
          <nav aria-label="Navegación móvil">{links}</nav>
        </details>
      </div>
    </div></header>
  );
}

export function Pie({ logueado }) {
  const p = usePathname() || "/";
  if (logueado && esApp(p)) return null;
  return (
    <footer className="site-footer"><div className="wrap footer-inner">
      <Link className="brand" href="/" aria-label="Somos Igera, inicio"><img className="brand-footer" src="/marca/firma-blanco.png" width={640} height={93} alt="" /></Link>
      <p>Marketing y gestión · La Plata, Buenos Aires</p>
    </div></footer>
  );
}

/** Cierra los menús desplegables al navegar o al tocar afuera. */
export function CerrarMenus() {
  const p = usePathname();
  const sel = "details.menu-cuenta[open],details.mobile-nav[open]";
  useEffect(() => { document.querySelectorAll(sel).forEach(d => d.removeAttribute("open")); }, [p]);
  useEffect(() => {
    const f = e => document.querySelectorAll(sel).forEach(d => { if (!d.contains(e.target)) d.removeAttribute("open"); });
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, []);
  return null;
}
