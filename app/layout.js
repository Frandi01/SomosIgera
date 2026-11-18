import "./globals.css";
import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { pestanas } from "@/lib/permisos";

export const metadata = {
  title: { default: "Somos Igera", template: "%s · Somos Igera" },
  description: "Marketing y gestión para emprendedores de La Plata. Negocios coherentes. Decisiones inteligentes.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
};
export const viewport = { themeColor: "#fffdf9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function Layout({ children }) {
  const u = await usuarioActual();
  const panel = u && pestanas(u.rol).length > 0 ? pestanas(u.rol)[0][1] : null;
  // Menú mínimo: la jornada, ingresar (o la cuenta si ya entró) y el botón de inscripción.
  const links = (
    <>
      <a href="/">La jornada</a>
      {u ? (
        <>
          {panel && <Link href={panel}>Panel</Link>}
          <Link href="/cuenta">{u.nombre.split(" ")[0]}</Link>
          <form action="/salir" method="post"><button className="linkbtn" type="submit">Salir</button></form>
        </>
      ) : <Link href="/ingresar">Ingresar</Link>}
    </>
  );
  return (
    <html lang="es-AR">
      <head>
        <link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
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
        <main>{children}</main>
        <footer className="site-footer"><div className="wrap footer-inner">
          <Link className="brand" href="/" aria-label="Somos Igera, inicio"><img className="brand-footer" src="/marca/firma-blanco.png" width={640} height={93} alt="" /></Link>
          <p>Marketing y gestión · La Plata, Buenos Aires</p>
        </div></footer>
      </body>
    </html>
  );
}
