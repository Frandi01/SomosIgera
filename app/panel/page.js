import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import PanelTabs from "@/components/PanelTabs";

export const metadata = { title: "Panel" };
export const dynamic = "force-dynamic";
const ars = n => "$" + Math.round(n).toLocaleString("es-AR");

export default async function Panel() {
  const u = await exigir("equipo", "/panel");
  const { rows } = await q("select * from inscripciones order by fecha desc");
  const [{ rows: [us] }] = await Promise.all([q("select count(*)::int n from usuarios where rol='alumno'")]);
  const total = rows.reduce((t, r) => t + (r.asistentes || 1), 0);
  const fuentes = Object.entries(rows.reduce((m, r) => (m[r.fuente || "directo"] = (m[r.fuente || "directo"] || 0) + (r.asistentes || 1), m), {})).sort((a, b) => b[1] - a[1]);
  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel" rol={u.rol} />
      <div className="stack">
        <div className="kpis">
          <div className="panel kpi"><span className="muted">Inscriptos a la jornada</span><b>{total}</b><span className="muted">meta 50 · {rows.length} formularios</span></div>
          <div className="panel kpi"><span className="muted">Cuentas de alumnos</span><b>{us.n}</b><span className="muted">{total ? Math.round(100 * us.n / total) : 0}% de los inscriptos · meta 30%</span></div>
          <div className="panel kpi"><span className="muted">Por fuente</span><span style={{ marginTop: 6 }}>{fuentes.map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}</span></div>
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Inscriptos</h2>
          <a className="btn ghost small" href="/panel/csv">Descargar CSV</a>
        </div>
        <div className="tbl"><table>
          <thead><tr><th>Fecha</th><th>Nombre</th><th>WhatsApp</th><th>Email</th><th>Salón</th><th>Rubro</th><th>Rol</th><th>Asist.</th><th>Origen</th><th>Fuente</th><th>Costo calc.</th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={11}>Todavía no hay inscriptos.</td></tr> : rows.map(r => (
            <tr key={r.id}>
              <td>{r.fecha.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}</td>
              <td>{r.nombre}</td><td>{r.whatsapp}</td><td>{r.email}</td><td>{r.negocio || "—"}</td><td>{r.rubro}</td><td>{r.rol}</td>
              <td className="num">{r.asistentes}</td><td>{r.origen}</td><td>{r.fuente}</td><td className="num">{r.calculadora ? ars(r.calculadora.costo) : "—"}</td>
            </tr>))}</tbody>
        </table></div>
      </div>
    </div>
  );
}
