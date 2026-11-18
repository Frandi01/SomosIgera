import "./globals.css";
import { Encabezado, Pie, CerrarMenus } from "@/components/Encabezado";
import { usuarioActual } from "@/lib/auth";
import { pestanas } from "@/lib/permisos";

export const metadata = {
  title: { default: "Somos Igera", template: "%s · Somos Igera" },
  description: "Marketing y gestión para emprendedores de La Plata. Negocios coherentes. Decisiones inteligentes.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Igera", statusBarStyle: "default" },
};
export const viewport = { themeColor: "#fffdf9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function Layout({ children }) {
  const u = await usuarioActual();
  const panel = u && pestanas(u.rol).length > 0 ? pestanas(u.rol)[0][1] : null;
  const datos = u ? { nombre: u.nombre, panel } : null;
  return (
    <html lang="es-AR">
      <head>
        <link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <Encabezado u={datos} />
        <CerrarMenus />
        <main>{children}</main>
        <Pie logueado={Boolean(u)} />
      </body>
    </html>
  );
}
