import { q } from "@/lib/db";
import { exigirNegocio, fijosMes } from "@/lib/negocio";
import { plantilla } from "@/lib/plantillas";
import NegocioTabs from "@/components/NegocioTabs";
import Calculadora from "@/components/Calculadora";

export const metadata = { title: "Calculadora" };
export const dynamic = "force-dynamic";

export default async function PaginaCalculadora() {
  const { u, n } = await exigirNegocio("/negocio/calculadora");
  const p = plantilla(n.plantilla);
  const [{ rows: items }, fijos] = await Promise.all([
    q("select id,nombre,precio,costo,minutos from items where usuario_id=$1 and activo order by nombre", [u.id]),
    fijosMes(u.id),
  ]);
  const lista = items.map(i => ({ id: i.id, nombre: i.nombre, precio: Number(i.precio), costo: Number(i.costo), minutos: i.minutos }));
  const primero = lista[0] || { nombre: "", precio: 0, costo: 0, minutos: 60 };
  return (
    <div className="wrap section stack">
      <NegocioTabs nombre={n.nombre} titulo="Calculadora" />
      <p className="muted">Probá qué pasa si cambiás el precio, los costos o {p.usaTiempo ? "las horas que llenás" : "lo que vendés"}. Arranca con tus datos.</p>
      <Calculadora porTiempo={p.usaTiempo} items={lista} palabras={{ item: p.item, Item: p.item.charAt(0).toUpperCase() + p.item.slice(1), costoItem: p.costoItem }}
        inicial={{ fijos: String(fijos), margen: String(n.margen_objetivo), puestos: String(n.puestos), horas: String(n.horas_mes), ocupacion: String(n.ocupacion), comision: String(n.comision),
          nombre: primero.nombre, precio: String(primero.precio), costo: String(primero.costo), minutos: String(primero.minutos || 60) }} />
    </div>
  );
}
