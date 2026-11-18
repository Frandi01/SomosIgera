import { redirect } from "next/navigation";
import Link from "next/link";
import { exigir } from "@/lib/auth";
import { q } from "@/lib/db";
import { guardarAjuste } from "@/lib/ajustes";
import { estadoEncuesta, nuevaClave, crearCodigo } from "@/lib/codigos";
import { puede } from "@/lib/permisos";
import { qrSvg } from "@/lib/qr";
import { origenPublico } from "@/lib/origen";
import PanelTabs from "@/components/PanelTabs";
import Copiar from "@/components/Copiar";

export const metadata = { title: "Encuesta" };
export const dynamic = "force-dynamic";

async function abrirCerrar(fd) {
  "use server";
  await exigir("encuesta", "update", "/panel/encuesta");
  await guardarAjuste("encuesta_abierta", fd.get("abrir") === "1" ? "1" : "0");
  redirect("/panel/encuesta");
}
async function regenerar() {
  "use server";
  await exigir("encuesta", "manage", "/panel/encuesta");
  await nuevaClave();
  redirect("/panel/encuesta?ok=link");
}
async function codigoManual(fd) {
  "use server";
  await exigir("encuesta", "update", "/panel/encuesta");
  const nota = String(fd.get("nota") || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 120);
  if (!nota) redirect("/panel/encuesta?error=nota");
  const c = await crearCodigo({ nota });
  redirect(`/panel/encuesta?nuevo=${encodeURIComponent(c)}`);
}

const fecha = d => new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function PanelEncuesta(props) {
  const sp = await props.searchParams;
  const u = await exigir("encuesta", "view", "/panel/encuesta");
  const { abierta, clave } = await estadoEncuesta();
  const link = `${await origenPublico()}/encuesta?k=${clave}`;
  const svg = await qrSvg(link);
  const { rows } = await q(
    `select e.*, c.codigo, c.usado from encuestas e left join codigos c on c.encuesta_id=e.id order by e.fecha desc`);
  const { rows: manuales } = await q("select codigo,nota,creado,usado from codigos where encuesta_id is null order by creado desc");
  const { rows: [cod] } = await q("select count(*)::int total, count(usado)::int usados from codigos");
  const n = rows.length;
  const prom = n ? (rows.reduce((t, r) => t + r.utilidad, 0) / n).toFixed(1).replace(".", ",") : "—";
  const nps = n ? Math.round(100 * (rows.filter(r => r.recomienda >= 9).length - rows.filter(r => r.recomienda <= 6).length) / n) : null;
  const temas = Object.entries(rows.reduce((m, r) => (r.tema && (m[r.tema] = (m[r.tema] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const edita = puede(u.rol, "encuesta", "update");

  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel/encuesta" rol={u.rol} />
      <div className="stack">
        {sp.ok === "link" && <p className="msg ok" role="status">Link nuevo generado. El QR anterior ya no funciona.</p>}
        {sp.error === "nota" && <p className="msg err" role="alert">Escribí para quién es el código.</p>}
        {sp.nuevo && <div className="msg ok row" role="status"><span>Código creado: <b>{sp.nuevo}</b>. Pasáselo a la persona; sirve una sola vez.</span><Copiar texto={sp.nuevo} /></div>}

        <div className="kpis">
          <div className="panel kpi"><span className="muted">Encuesta</span><span style={{ marginTop: 6 }}>{abierta ? <span className="pill ok">Abierta</span> : <span className="pill gray">Cerrada</span>}</span></div>
          <div className="panel kpi"><span className="muted">Respuestas</span><b>{n}</b></div>
          <div className="panel kpi"><span className="muted">Utilidad promedio</span><b>{prom}<small className="muted" style={{ fontSize: "1rem" }}> / 5</small></b></div>
          <div className="panel kpi"><span className="muted">NPS</span><b>{nps === null ? "—" : nps}</b><span className="muted" style={{ fontSize: ".8rem" }}>% que recomienda (9–10) menos % crítico (0–6)</span></div>
          <div className="panel kpi"><span className="muted">Cuentas creadas</span><b>{cod.usados}<small className="muted" style={{ fontSize: "1rem" }}> de {cod.total} códigos</small></b></div>
        </div>

        <div className="encuesta-qr">
          <div className="panel stack">
            <h2>QR para la jornada</h2>
            <p className="muted">Proyectalo o imprimilo. Quien lo escanea completa la encuesta y recibe su código único para crear la cuenta. Solo funciona mientras la encuesta esté abierta.</p>
            {edita && (
              <form action={abrirCerrar} className="row">
                <input type="hidden" name="abrir" value={abierta ? "0" : "1"} />
                <button className={abierta ? "btn ghost" : "button"} type="submit">{abierta ? "Cerrar la encuesta" : "Abrir la encuesta"}</button>
                <Link className="btn ghost" href="/panel/encuesta/qr" target="_blank">Pantalla completa para proyectar</Link>
              </form>
            )}
            <p className="muted" style={{ fontSize: ".85rem", wordBreak: "break-all" }}>{link}</p>
            {puede(u.rol, "encuesta", "manage") && (
              <form action={regenerar}><button className="btn small danger" type="submit">Generar link nuevo (invalida el QR actual)</button></form>
            )}
          </div>
          <div className="panel qr-box" dangerouslySetInnerHTML={{ __html: svg }} aria-label="Código QR de la encuesta" role="img" />
        </div>

        {edita && (
          <form action={codigoManual} className="panel stack" style={{ maxWidth: 560 }}>
            <h2>Código manual</h2>
            <p className="muted">Para alguien que fue a la jornada pero no pudo completar la encuesta.</p>
            <label htmlFor="m-nota">Para quién es<input id="m-nota" name="nota" maxLength={120} placeholder="Ej: Laura Pérez, peluquería Centro" /></label>
            <div><button className="button" type="submit">Crear código</button></div>
          </form>
        )}

        {temas.length > 0 && <p className="muted">Temas que más sirvieron: {temas.map(([t, c]) => `${t} (${c})`).join(" · ")}</p>}
        <div className="row" style={{ justifyContent: "space-between" }}><h2>Respuestas</h2>{n > 0 && <a className="btn small ghost" href="/panel/encuesta/csv">Descargar CSV</a>}</div>
        {n === 0 ? <p className="muted">Todavía no hay respuestas.</p> : (
          <div className="tbl"><table>
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Email</th><th className="num">Útil</th><th className="num">Recomienda</th><th>Tema</th><th>Va a aplicar</th><th>Próximo</th><th>Comentario</th><th>Código</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id}>
                <td>{fecha(r.fecha)}</td><td>{r.nombre}</td><td>{r.email || "—"}</td><td className="num">{r.utilidad}</td><td className="num">{r.recomienda}</td><td>{r.tema || "—"}</td>
                <td style={{ whiteSpace: "normal", minWidth: 200 }}>{r.aplicar || "—"}</td><td style={{ whiteSpace: "normal", minWidth: 160 }}>{r.proximo || "—"}</td><td style={{ whiteSpace: "normal", minWidth: 200 }}>{r.comentario || "—"}</td>
                <td>{r.codigo}{" "}{r.usado ? <span className="pill ok">Usado</span> : <span className="pill gray">Sin usar</span>}</td>
              </tr>))}
            </tbody>
          </table></div>
        )}
        {manuales.length > 0 && (<>
          <h2>Códigos manuales</h2>
          <div className="tbl"><table>
            <thead><tr><th>Creado</th><th>Para</th><th>Código</th><th>Estado</th></tr></thead>
            <tbody>{manuales.map(m => <tr key={m.codigo}><td>{fecha(m.creado)}</td><td>{m.nota}</td><td>{m.codigo}</td><td>{m.usado ? <span className="pill ok">Usado</span> : <span className="pill gray">Sin usar</span>}</td></tr>)}</tbody>
          </table></div>
        </>)}
      </div>
    </div>
  );
}
