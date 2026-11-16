import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { exigir, crearLinkRestablecer } from "@/lib/auth";
import { q } from "@/lib/db";
import PanelTabs from "@/components/PanelTabs";

export const metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

async function cambiarRol(fd) {
  "use server";
  const yo = await exigir("admin", "/panel/usuarios");
  const id = parseInt(fd.get("id")), rol = String(fd.get("rol"));
  if (!id || !["admin", "equipo", "alumno"].includes(rol) || id === yo.id) redirect("/panel/usuarios");
  await q("update usuarios set rol=$1 where id=$2", [rol, id]);
  revalidatePath("/panel/usuarios");
}
async function linkClave(fd) {
  "use server";
  await exigir("admin", "/panel/usuarios");
  const id = parseInt(fd.get("id"));
  if (!id) redirect("/panel/usuarios");
  const token = await crearLinkRestablecer(id);
  redirect(`/panel/usuarios?link=${token}&para=${id}`);
}

export default async function Usuarios({ searchParams }) {
  const yo = await exigir("admin", "/panel/usuarios");
  const { rows } = await q("select id,nombre,email,rol,creado from usuarios order by creado desc");
  const h = headers();
  const origin = (h.get("x-forwarded-proto") || "http").split(",")[0] + "://" + (h.get("x-forwarded-host") || h.get("host"));
  const para = rows.find(r => r.id === parseInt(searchParams.para));
  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel/usuarios" rol={yo.rol} />
      <div className="stack">
        {searchParams.link && para && (
          <div className="msg ok stack" style={{ gap: 6 }}>
            <p>Link para que <b>{para.nombre}</b> cambie su contraseña. Vale 48 horas y se usa una sola vez. Mandáselo por WhatsApp:</p>
            <code style={{ userSelect: "all", wordBreak: "break-all" }}>{origin}/restablecer/{searchParams.link}</code>
          </div>
        )}
        <p className="muted">{rows.length} cuentas. Los admins gestionan usuarios; el equipo ve inscriptos y carga cursos.</p>
        <div className="tbl"><table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Alta</th><th>Rol</th><th>Contraseña</th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id}>
              <td>{r.nombre}</td><td>{r.email}</td>
              <td>{r.creado.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</td>
              <td>{r.id === yo.id ? <span className="pill">admin (vos)</span> : (
                <form action={cambiarRol} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                  <input type="hidden" name="id" value={r.id} />
                  <select name="rol" defaultValue={r.rol} aria-label={`Rol de ${r.nombre}`} style={{ width: "auto", padding: "6px 8px" }}>
                    <option value="alumno">Alumno</option><option value="equipo">Equipo</option><option value="admin">Admin</option>
                  </select>
                  <button className="btn ghost small" type="submit">Guardar</button>
                </form>)}</td>
              <td><form action={linkClave}><input type="hidden" name="id" value={r.id} /><button className="btn ghost small" type="submit">Crear link</button></form></td>
            </tr>))}</tbody>
        </table></div>
      </div>
    </div>
  );
}
