import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigir } from "@/lib/auth";
import { leerAjustes, guardarAjuste, whatsapp, MENSAJE_WA, diasDesdeBackup } from "@/lib/ajustes";
import { aWaId } from "@/lib/telefono";
import PanelTabs from "@/components/PanelTabs";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

async function guardarWhatsapp(fd) {
  "use server";
  await exigir("configuracion", "update", "/panel/configuracion");
  const numero = String(fd.get("numero") || "").trim().slice(0, 40);
  const mensaje = String(fd.get("mensaje") || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 300);
  if (numero && !aWaId(numero)) redirect("/panel/configuracion?error=numero");
  await guardarAjuste("whatsapp_numero", numero);
  await guardarAjuste("whatsapp_mensaje", mensaje || MENSAJE_WA);
  revalidatePath("/", "layout");
  redirect("/panel/configuracion?ok=1");
}

export default async function Configuracion(props) {
  const searchParams = await props.searchParams;
  const u = await exigir("configuracion", "view", "/panel/configuracion");
  const a = await leerAjustes();
  const wa = await whatsapp();
  const dias = await diasDesdeBackup();
  const backupListo = Boolean(process.env.BACKUP_SECRET && process.env.BACKUP_SECRET.trim().length >= 32);
  return (
    <div className="wrap section">
      <h1 style={{ marginBottom: 16 }}>Panel</h1>
      <PanelTabs actual="/panel/configuracion" rol={u.rol} />
      <div className="stack">
        {searchParams.error === "numero" && <p className="msg err" role="alert">Ese número no es un celular argentino válido. Escribilo con característica, por ejemplo 221 596-1310.</p>}
        {searchParams.ok && <p className="msg ok" role="status">Guardado. La página ya muestra el número nuevo.</p>}

        <div className="kpis">
          <div className="panel kpi"><span className="muted">Número en la página</span><b style={{ fontSize: "1.1rem", marginTop: 6 }}>{wa ? wa.display : "Sin cargar"}</b></div>
          <div className="panel kpi"><span className="muted">Botón de WhatsApp</span><span style={{ marginTop: 6 }}>{wa ? <span className="pill ok">Visible</span> : <span className="pill gray">Oculto</span>}</span></div>
          <div className="panel kpi"><span className="muted">API de Meta</span><span style={{ marginTop: 6 }}><span className="pill gray">Fase 4</span></span></div>
          <div className="panel kpi"><span className="muted">Copia de seguridad</span><span style={{ marginTop: 6 }}>{!backupListo ? <span className="pill gray">Sin instalar</span> : dias === null ? <span className="pill gray">Nunca</span> : dias > 10 ? <span className="pill" style={{ color: "var(--warn)" }}>Hace {dias} días</span> : <span className="pill ok">{dias === 0 ? "Hoy" : `Hace ${dias} días`}</span>}</span></div>
        </div>

        <form action={guardarWhatsapp} className="panel stack" style={{ maxWidth: 560 }}>
          <h2>WhatsApp</h2>
          <label htmlFor="w-num">Número
            <input id="w-num" name="numero" inputMode="tel" defaultValue={a.whatsapp_numero || ""} placeholder="221 596-1310" />
          </label>
          <label htmlFor="w-msg">Mensaje inicial
            <input id="w-msg" name="mensaje" defaultValue={a.whatsapp_mensaje || MENSAJE_WA} maxLength={300} />
          </label>
          <div className="row">
            <button className="btn" type="submit">Guardar</button>
            {wa && <a className="btn ghost" href={wa.link} target="_blank" rel="noopener">Probar el link</a>}
          </div>
        </form>
      </div>
    </div>
  );
}
