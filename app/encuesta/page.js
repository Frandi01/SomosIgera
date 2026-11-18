import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { q } from "@/lib/db";
import { limitar } from "@/lib/auth";
import { estadoEncuesta, claveValida, crearCodigo } from "@/lib/codigos";
import Copiar from "@/components/Copiar";

export const metadata = { title: "Encuesta de la jornada", robots: { index: false } };
export const dynamic = "force-dynamic";

const COOKIE = "igera_cupon";
const TEMAS = ["Costos", "Administración y caja", "Redes sociales", "Anuncios", "Inteligencia artificial", "Cómo escalar el negocio"];
const txt = (v, max = 600) => String(v ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, max);

async function responder(fd) {
  "use server";
  const k = String(fd.get("k") || "");
  const { abierta, clave } = await estadoEncuesta();
  if (!abierta || !claveValida(k, clave)) redirect("/encuesta");
  const volver = e => redirect(`/encuesta?k=${encodeURIComponent(k)}&error=${e}`);
  // En el salón muchos comparten el wifi (misma IP): el límite es amplio y frena solo abusos.
  if ((await limitar("encuesta", 60, 10 * 60e3)).limitado) volver("intentos");
  const nombre = txt(fd.get("nombre"), 120);
  const email = txt(fd.get("email"), 200).toLowerCase();
  const utilidad = parseInt(fd.get("utilidad"));
  const recomienda = parseInt(fd.get("recomienda"));
  const tema = TEMAS.includes(fd.get("tema")) ? fd.get("tema") : null;
  if (!nombre || !(utilidad >= 1 && utilidad <= 5) || !(recomienda >= 0 && recomienda <= 10)) volver("datos");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) volver("email");
  const { rows } = await q(
    `insert into encuestas (nombre,email,utilidad,tema,recomienda,aplicar,proximo,comentario)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [nombre, email || null, utilidad, tema, recomienda, txt(fd.get("aplicar")) || null, txt(fd.get("proximo")) || null, txt(fd.get("comentario"), 1500) || null]);
  const codigo = await crearCodigo({ encuestaId: rows[0].id });
  (await cookies()).set(COOKIE, codigo, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 86400, secure: process.env.NODE_ENV === "production" });
  redirect(`/encuesta?k=${encodeURIComponent(k)}`);
}

const ERR = { datos: "Completá tu nombre y las dos preguntas con puntaje.", email: "Revisá el mail: le falta algo (ej: nombre@gmail.com).", intentos: "Demasiados envíos desde esta red. Esperá unos minutos." };

export default async function Encuesta(props) {
  const sp = await props.searchParams;
  const { abierta, clave } = await estadoEncuesta();
  const valida = claveValida(sp.k, clave);

  // Si este celular ya completó la encuesta, se le vuelve a mostrar su código (no se genera otro).
  const guardado = (await cookies()).get(COOKIE)?.value;
  if (guardado) {
    const { rows } = await q("select codigo, usado from codigos where codigo=$1", [guardado]);
    if (rows[0]) return <Listo codigo={rows[0].codigo} usado={Boolean(rows[0].usado)} />;
  }

  if (!valida || !abierta) {
    return (
      <div className="wrap narrow section stack">
        <h1>Encuesta de la jornada</h1>
        <p className="muted">{valida ? "La encuesta está cerrada en este momento." : "Para completar la encuesta, escaneá el código QR que te mostramos en la jornada."}</p>
        <div><Link className="button" href="/">Ir al inicio</Link></div>
      </div>
    );
  }

  return (
    <div className="wrap narrow section stack">
      <p className="eyebrow">Gracias por venir</p>
      <h1>¿Cómo te fue en <em>la jornada?</em></h1>
      <p className="muted">Respondé en un minuto y te damos tu código para crear tu cuenta y entrar al contenido: la calculadora de costos, los cursos y la grabación.</p>
      {sp.error && <p className="msg err" role="alert">{ERR[sp.error] || "Algo salió mal. Probá de nuevo."}</p>}
      <form action={responder} className="panel stack encuesta">
        <input type="hidden" name="k" value={sp.k} />
        <fieldset className="escala">
          <legend>¿Qué tan útil te resultó? <span className="req">*</span></legend>
          <div className="opciones">{[1, 2, 3, 4, 5].map(n => <label key={n}><input type="radio" name="utilidad" value={n} required /><span>{n}</span></label>)}</div>
          <p className="extremos"><span>Nada útil</span><span>Muy útil</span></p>
        </fieldset>
        <label htmlFor="e-tema">¿Qué tema te sirvió más?
          <select id="e-tema" name="tema" defaultValue=""><option value="">Elegí</option>{TEMAS.map(t => <option key={t}>{t}</option>)}</select>
        </label>
        <label htmlFor="e-aplicar">¿Qué vas a aplicar primero en tu negocio?<textarea id="e-aplicar" name="aplicar" maxLength={600} /></label>
        <fieldset className="escala diez">
          <legend>Del 0 al 10, ¿qué tan probable es que recomiendes la jornada? <span className="req">*</span></legend>
          <div className="opciones">{Array.from({ length: 11 }, (_, n) => <label key={n}><input type="radio" name="recomienda" value={n} required /><span>{n}</span></label>)}</div>
          <p className="extremos"><span>Nada probable</span><span>Muy probable</span></p>
        </fieldset>
        <label htmlFor="e-prox">¿Sobre qué te gustaría aprender en el próximo encuentro?<input id="e-prox" name="proximo" maxLength={600} /></label>
        <label htmlFor="e-com">¿Algo más que quieras contarnos?<textarea id="e-com" name="comentario" maxLength={1500} /></label>
        <div className="grid2">
          <label htmlFor="e-nom"><span>Nombre y apellido <span className="req">*</span></span><input id="e-nom" name="nombre" autoComplete="name" required maxLength={120} /></label>
          <label htmlFor="e-mail">Email<small>Opcional</small><input id="e-mail" name="email" type="email" autoComplete="email" maxLength={200} /></label>
        </div>
        <button className="button" type="submit">Enviar y recibir mi código</button>
      </form>
    </div>
  );
}

function Listo({ codigo, usado }) {
  return (
    <div className="wrap narrow section stack">
      <p className="eyebrow">¡Gracias!</p>
      <h1>{usado ? "Ya usaste tu código." : <>Este es tu <em>código.</em></>}</h1>
      {usado ? (
        <>
          <p className="muted">Tu cuenta ya está creada. Ingresá con tu mail y contraseña para ver el contenido.</p>
          <div><Link className="button" href="/ingresar">Ingresar</Link></div>
        </>
      ) : (
        <>
          <div className="panel stack cupon">
            <span className="muted">Tu código de asistente</span>
            <b className="cupon-codigo">{codigo}</b>
            <span className="muted">Sirve una sola vez, para crear tu cuenta. Guardalo o sacale una captura.</span>
            <div className="row"><Link className="button" href={`/registro?codigo=${encodeURIComponent(codigo)}`}>Crear mi cuenta <span aria-hidden="true">↗</span></Link><Copiar texto={codigo} /></div>
          </div>
          <p className="muted">Con tu cuenta entrás a la calculadora de costos, los cursos y la grabación de la jornada.</p>
        </>
      )}
    </div>
  );
}
