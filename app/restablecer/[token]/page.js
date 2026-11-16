import { redirect } from "next/navigation";
import { usarLinkRestablecer, limitar } from "@/lib/auth";
import Aviso from "@/components/Aviso";

export const metadata = { title: "Nueva contraseña", robots: { index: false } };

async function cambiar(fd) {
  "use server";
  const token = String(fd.get("token") || "");
  if (await limitar("restablecer", 10)) redirect(`/restablecer/${token}?error=intentos`);
  const password = String(fd.get("password") || "");
  if (password.length < 8) redirect(`/restablecer/${token}?error=corta`);
  const id = await usarLinkRestablecer(token, password);
  if (!id) redirect(`/restablecer/${token}?error=link`);
  redirect("/ingresar?ok=clave");
}

export default async function Restablecer(props) {
  const params = await props.params, searchParams = await props.searchParams;
  return (
    <div className="wrap narrow section stack">
      <h1>Elegí una contraseña nueva</h1>
      <Aviso error={searchParams.error} />
      <form action={cambiar} className="panel stack">
        <input type="hidden" name="token" value={params.token} />
        <label htmlFor="n-pass">Contraseña nueva<small>Mínimo 8 caracteres</small><input id="n-pass" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
        <button className="btn" type="submit">Guardar contraseña</button>
      </form>
    </div>
  );
}
