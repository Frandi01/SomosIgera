import Link from "next/link";
import { pestanas } from "@/lib/permisos";
export default function PanelTabs({ actual, rol }) {
  return <div className="tabs">{pestanas(rol).map(([, h, t]) => <Link key={h} href={h} aria-current={actual === h ? "page" : undefined}>{t}</Link>)}</div>;
}
