import { ERRORES } from "@/lib/util";
export default function Aviso({ error, ok }) {
  if (error) return <p className="msg err" role="alert">{ERRORES[error] || "Algo salió mal. Probá de nuevo."}</p>;
  if (ok) return <p className="msg ok" role="status">{ok}</p>;
  return null;
}
