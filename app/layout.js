import "./globals.css";
import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { pestanas } from "@/lib/permisos";

export const metadata = {
  title: { default: "Somos Igera", template: "%s · Somos Igera" },
  description: "Formación práctica para emprendedores de La Plata.",
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232F5D8A'/%3E%3Ctext x='32' y='45' font-family='Arial,sans-serif' font-size='38' font-weight='700' fill='white' text-anchor='middle'%3EI%3C/text%3E%3C/svg%3E" },
};
export const viewport = { themeColor: "#2F5D8A", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function Layout({ children }) {
  const u = await usuarioActual();
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" />
      </head>
      <body>
        <nav className="top"><div className="wrap">
          <Link className="logo" href="/"><span className="logo-mark" title="Logo provisorio">LOGO</span>Somos Igera</Link>
          <div className="links">
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
        <footer className="foot"><div className="wrap">Somos Igera · Crecé. Conectá. Evolucioná. · La Plata, Buenos Aires</div></footer>
      </body>
    </html>
  );
}
