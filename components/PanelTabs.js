import Link from "next/link";
export default function PanelTabs({ actual, rol }) {
  const tabs = [["/panel", "Inscriptos"], ["/panel/cursos", "Cursos"]];
  if (rol === "admin") tabs.push(["/panel/usuarios", "Usuarios"]);
  return <div className="tabs">{tabs.map(([h, t]) => <Link key={h} href={h} aria-current={actual === h ? "page" : undefined}>{t}</Link>)}</div>;
}
