// Datos del panel "Mi negocio". Toda consulta filtra por usuario_id: nadie ve lo de otro.
import "server-only";
import { redirect } from "next/navigation";
import { q } from "./db";
import { exigir } from "./auth";
import { CATEGORIA_FIJO } from "./plantillas";

/** Usuario + su negocio. Sin perfil todavía → a las preguntas iniciales. */
export async function exigirNegocio(volver = "/negocio") {
  const u = await exigir("negocio", "view", volver);
  const { rows } = await q("select * from negocios where usuario_id=$1", [u.id]);
  if (!rows[0]) redirect("/negocio/empezar");
  return { u, n: rows[0] };
}

export const hoyAR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

export async function fijosMes(uid) {
  const { rows } = await q("select coalesce(sum(monto),0)::bigint t from gastos_fijos where usuario_id=$1", [uid]);
  return Number(rows[0].t);
}

/** Resumen del mes de `fecha` (YYYY-MM-DD) para la pantalla Hoy. */
export async function resumen(uid, fecha) {
  const mes = fecha.slice(0, 7);
  const [{ rows: dia }, { rows: m }, fijos] = await Promise.all([
    q(`select tipo, coalesce(medio,'') medio, sum(monto)::bigint t from movimientos
       where usuario_id=$1 and fecha=$2 group by tipo, medio`, [uid, fecha]),
    q(`select tipo, (categoria = $3) es_fijo, sum(monto)::bigint t, count(*)::int n,
              min(extract(day from fecha))::int desde from movimientos
       where usuario_id=$1 and to_char(fecha,'YYYY-MM')=$2 group by tipo, es_fijo`, [uid, mes, CATEGORIA_FIJO]),
    fijosMes(uid),
  ]);
  const sum = (arr, f) => arr.filter(f).reduce((t, r) => t + Number(r.t), 0);
  const ventasMes = sum(m, r => r.tipo === "venta");
  const gastosMes = sum(m, r => r.tipo === "gasto");
  const fijosPagados = sum(m, r => r.tipo === "gasto" && r.es_fijo);
  // Los fijos estimados que todavía no se cargaron como gasto (para no contarlos dos veces).
  const fijosPendientes = Math.max(0, fijos - fijosPagados);
  const necesario = gastosMes + fijosPendientes;
  const [y, mo, d] = fecha.split("-").map(Number);
  const diasMes = new Date(y, mo, 0).getDate();
  // Proyección con el ritmo de los días que ya tienen datos (desde la primera carga del mes),
  // no con días en los que todavía no se usaba el panel.
  const desde = m.length ? Math.min(...m.map(r => r.desde)) : d;
  const diasConDatos = Math.max(1, d - desde + 1), restantes = diasMes - d;
  const gastosVar = gastosMes - fijosPagados;
  const proyVentas = ventasMes + ventasMes / diasConDatos * restantes;
  const proyNecesario = Math.max(fijos, fijosPagados) + gastosVar + gastosVar / diasConDatos * restantes;
  return {
    dia: { ventas: sum(dia, r => r.tipo === "venta"), gastos: sum(dia, r => r.tipo === "gasto"), porMedio: dia.filter(r => r.tipo === "venta") },
    ventasMes, gastosMes, fijos, fijosPendientes, necesario,
    ganancia: ventasMes - necesario,
    proyVentas, proyNecesario, proyGanancia: proyVentas - proyNecesario,
    dia_del_mes: d, diasMes, diasConDatos,
    hayMovimientos: m.length > 0,
  };
}

export const entero = (v, max = 1e12) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
};
export const texto = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
