import "./globals.css";
import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { pestanas } from "@/lib/permisos";

export const metadata = {
  title: { default: "Somos Igera", template: "%s · Somos Igera" },
  description: "Marketing y gestión para emprendedores de La Plata. Negocios coherentes. Decisiones inteligentes.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
};
export const viewport = { themeColor: "#342446", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function Layout({ children }) {
  const u = await usuarioActual();
  return (
    <html lang="es">
      <head>
        <link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <nav className="top"><div className="wrap">
          <Link className="logo" href="/"><img src="/marca/logo-blanco.png" width={560} height={169} alt="Somos Igera" /></Link>
          <div className="links">
            <a href="/calculadora">Calculadora</a>
            <Link href="/cursos">Cursos</Link>
            {u && pestanas(u.rol).length > 0 && <Link href={pestanas(u.rol)[0][1]}>Panel</Link>}
            {u ? (
              <>
                <Link href="/cuenta">{u.nombre.split(" ")[0]}</Link>
                <form action="/salir" method="post"><button className="linkbtn" type="submit">Salir</button></form>
              </>
            ) : (
              <>
                <Link href="/ingresar">Ingresar</Link>
                <Link className="strong" href="/registro">Crear cuenta</Link>
              </>
            )}
          </div>
        </div></nav>
        <main>{children}</main>
        <footer className="foot"><div className="wrap">
          <img src="/marca/firma-blanco.png" width={640} height={93} alt="Somos Igera" />
          <span>Negocios coherentes. <em>Decisiones inteligentes.</em></span>
        </div></footer>
      </body>
    </html>
  );
}
