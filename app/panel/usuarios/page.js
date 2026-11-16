import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { exigir, crearLinkRestablecer, esDueno } from "@/lib/auth";
import { q } from "@/lib/db";
import { ROLES_ASIGNABLES } from "@/lib/permisos";
import PanelTabs from "@/components/PanelTabs";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";
const ROL = { admin: "Admin", equipo: "Equipo", alumno: "Alumno" };
const fecha = d => d ? d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) : "—";

// Como objetivoGestionable de DAIA: nadie se gestiona a sí mismo desde acá y la cuenta del
// dueño (ADMIN_EMAILS) no se puede bajar de rol, desactivar ni resetear.
async function objetivo(yo, fd) {
  const id = parseInt(fd.get("id"));
  if (!id || id === yo.id) redirect("/panel/usuarios?error=propia");
  const { rows: [t] } = await q("select id,email from usuarios where id=$1", [id]);
  if (!t) redirect("/panel/usuarios");
  if (esDueno(t.email)) redirect("/panel/usuarios?error=dueno");
  return t;
}

async function cambiarRol(fd) {
  "use server";
  const yo = await exigir("usuarios", "update", "/panel/usuarios");
  const t = await objetivo(yo, fd);
  const rol = String(fd.get("rol"));
  if (!ROLES_ASIGNABLES.includes(rol)) redirect("/panel/usuarios");
  await q("update usuarios set rol=$1 where id=$2", [rol, t.id]);
  revalidatePath("/panel/usuarios");
  redirect("/panel/usuarios?ok=rol");
}
async function cambiarEstado(fd) {
  "use server";
  const yo = await exigir("usuarios", "update", "/panel/usuarios");
  const t = await objetivo(yo, fd);
  const activo = fd.get("activo") === "1";
  await q("update usuarios set activo=$1 where id=$2", [activo, t.id]);
  // Desactivar corta el acceso al instante: se borran todas sus sesiones.
  if (!activo) await q("delete from sesiones where usuario_id=$1", [t.id]);
  revalidatePath("/panel/usuarios");
  redirect(`/panel/usuarios?ok=${activo ? "activada" : "desactivada"}`);
}
async function linkClave(fd) {
  "use server";
  const yo = await exigir("usuarios", "update", "/panel/usuarios");
  const t = await objetivo(yo, fd);
  const token = await crearLinkRestablecer(t.id);
  redirect(`/panel/usuarios?link=${token}&para=${t.id}`);
}

const AVISOS = {
  propia: ["err", "Tu propia cuenta se gestiona desde Mi cuenta."],
  dueno: ["err", "La cuenta del dueño no se puede modificar desde el panel."],
  rol: ["ok", "Rol actualizado. Rige desde su próxima acción."],
  activada: ["ok", "Cuenta activada."],
  desactivada: ["ok", "Cuenta desactivada. Se cerraron todas sus sesiones."],
};

export default async function Usuarios(props) {
  const searchParams = await props.searchParams;
  const yo = await exigir("usuarios", "view", "/panel/usuarios");
  const { rows } = await q("select id,nombre,email,rol,activo,creado,ultimo_ingreso from usuarios order by creado desc");
  const h = await headers();
  const origin = (h.get("x-forwarded-proto") || "http").split(",")[0] + "://" + (h.get("x-forwarded-host") || h.get("host"));
  const para = rows.find(r => r.id === parseInt(searchParams.para));
  const aviso = AVISOS[searchParams.error] || AVISOS[searchParams.ok];
  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel/usuarios" rol={yo.rol} />
      <div className="stack">
        {aviso && <p className={`msg ${aviso[0]}`} role={aviso[0] === "err" ? "alert" : "status"}>{aviso[1]}</p>}
        {searchParams.link && para && (
          <div className="msg ok stack" style={{ gap: 6 }}>
            <p>Link para que <b>{para.nombre}</b> cambie su contraseña. Vale 48 horas y se usa una sola vez. Mandáselo por WhatsApp:</p>
            <code style={{ userSelect: "all", wordBreak: "break-all" }}>{origin}/restablecer/{searchParams.link}</code>
          </div>
        )}
        <div className="tbl"><table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Alta</th><th>Último ingreso</th><th>Estado</th><th>Rol</th><th>Contraseña</th></tr></thead>
          <tbody>{rows.map(r => {
            const fija = r.id === yo.id || esDueno(r.email);
            return (
              <tr key={r.id}>
                <td>{r.nombre}</td><td>{r.email}</td>
                <td>{fecha(r.creado)}</td><td>{fecha(r.ultimo_ingreso)}</td>
                <td>{fija ? <span className="pill ok">Activa</span> : (
                  <form action={cambiarEstado} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="activo" value={r.activo ? "0" : "1"} />
                    {r.activo ? <span className="pill ok">Activa</span> : <span className="pill gray">Desactivada</span>}
                    <button className={r.activo ? "btn danger small" : "btn ghost small"} type="submit">{r.activo ? "Desactivar" : "Activar"}</button>
                  </form>)}</td>
                <td>{fija ? <span className="pill">{ROL[r.rol]}{r.id === yo.id ? " (vos)" : " (dueño)"}</span> : (
                  <form action={cambiarRol} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    <input type="hidden" name="id" value={r.id} />
                    <select name="rol" defaultValue={r.rol} aria-label={`Rol de ${r.nombre}`} style={{ width: "auto", padding: "6px 8px" }}>
                      {ROLES_ASIGNABLES.map(x => <option key={x} value={x}>{ROL[x]}</option>)}
                    </select>
                    <button className="btn ghost small" type="submit">Guardar</button>
                  </form>)}</td>
                <td>{fija ? "—" : <form action={linkClave}><input type="hidden" name="id" value={r.id} /><button className="btn ghost small" type="submit">Crear link</button></form>}</td>
              </tr>);
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}
