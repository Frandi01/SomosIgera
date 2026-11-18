import { exigir } from "@/lib/auth";
import { estadoEncuesta } from "@/lib/codigos";
import { qrSvg } from "@/lib/qr";
import { origenPublico } from "@/lib/origen";

export const metadata = { title: "QR de la encuesta" };
export const dynamic = "force-dynamic";

// Pantalla para proyectar en la jornada: QR grande y una instrucción corta.
export default async function QrProyectar() {
  await exigir("encuesta", "view", "/panel/encuesta/qr");
  const { abierta, clave } = await estadoEncuesta();
  const svg = await qrSvg(`${await origenPublico()}/encuesta?k=${clave}`);
  return (
    <div className="qr-proyectar">
      <div className="qr-proyectar-texto">
        <p className="eyebrow">Gracias por venir</p>
        <h1>Escaneá, contanos cómo te fue <em>y recibí tu acceso.</em></h1>
        <p className="muted">Completá la encuesta y te damos tu código para entrar a la calculadora de costos.</p>
        {!abierta && <p className="msg err" role="alert">La encuesta está cerrada: abrila desde el panel antes de mostrar el QR.</p>}
      </div>
      <div className="qr-proyectar-codigo" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="Código QR de la encuesta" />
    </div>
  );
}
