import Link from "next/link";
export default function NotFound() {
  return <div className="wrap narrow section stack"><h1>No encontramos esa página</h1><p className="muted">Puede que el link esté mal o que el curso ya no esté publicado.</p><div><Link className="btn" href="/cursos">Ver cursos</Link></div></div>;
}
