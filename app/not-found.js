import Link from "next/link";
export default function NotFound() {
  return <div className="wrap narrow section stack"><h1>No encontramos esa página</h1><p className="muted">Puede que el link esté mal o que la página ya no exista.</p><div><Link className="button" href="/">Ir al inicio</Link></div></div>;
}
