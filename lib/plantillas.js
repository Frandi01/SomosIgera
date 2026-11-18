// Plantillas del panel "Mi negocio". Un solo panel con módulos: la plantilla decide qué se ve y
// con qué palabras. Sumar un rubro = sumar una plantilla acá, no otro sistema.
// Módulo puro (sin base): se usa en páginas y componentes.

export const PLANTILLAS = {
  servicios: {
    nombre: "Servicios",
    item: "servicio", items: "servicios", Items: "Servicios",
    costoItem: "Insumos por servicio",
    capacidad: "Puestos de trabajo (sillones, camillas, boxes)",
    usaTiempo: true, usaComision: true,
    ejemplos: [{ nombre: "Corte", precio: 15000, costo: 1500, minutos: 45 }, { nombre: "Color", precio: 40000, costo: 9000, minutos: 120 }],
    categoriasGasto: ["Insumos y productos", "Gasto fijo (alquiler, servicios, sueldos)", "Comisiones", "Otro"],
  },
  gastronomia: {
    nombre: "Gastronomía",
    item: "plato", items: "platos", Items: "Platos y productos",
    costoItem: "Costo de ingredientes",
    capacidad: "Mesas o lugares",
    usaTiempo: false, usaComision: false,
    ejemplos: [{ nombre: "Milanesa con papas", precio: 12000, costo: 4200 }, { nombre: "Gaseosa", precio: 3000, costo: 1100 }],
    categoriasGasto: ["Compras a proveedores", "Gasto fijo (alquiler, servicios, sueldos)", "Otro"],
  },
  comercio: {
    nombre: "Comercio",
    item: "producto", items: "productos", Items: "Productos",
    costoItem: "Costo de compra",
    capacidad: null,
    usaTiempo: false, usaComision: false,
    ejemplos: [{ nombre: "Producto A", precio: 10000, costo: 6000 }],
    categoriasGasto: ["Compra de mercadería", "Gasto fijo (alquiler, servicios, sueldos)", "Otro"],
  },
  produccion: {
    nombre: "Producción propia",
    item: "producto", items: "productos", Items: "Productos",
    costoItem: "Costo de materiales por unidad",
    capacidad: null,
    usaTiempo: false, usaComision: false,
    ejemplos: [{ nombre: "Producto A", precio: 10000, costo: 3500 }],
    categoriasGasto: ["Materia prima", "Gasto fijo (alquiler, servicios, sueldos)", "Otro"],
  },
};

export const MEDIOS = { efectivo: "Efectivo", transferencia: "Transferencia", mercadopago: "Mercado Pago", tarjeta: "Tarjeta" };
export const CATEGORIA_FIJO = "Gasto fijo (alquiler, servicios, sueldos)";

/** Pregunta 1 (qué vendés) + rubro → plantilla. */
export function elegirPlantilla(queVende, rubro) {
  if (rubro === "gastronomia") return "gastronomia";
  if (queVende === "servicios") return "servicios";
  if (queVende === "fabrico") return "produccion";
  if (queVende === "revendo") return "comercio";
  // Mezcla: manda el rubro.
  if (rubro === "belleza" || rubro === "oficio") return "servicios";
  return "comercio";
}

export const plantilla = clave => PLANTILLAS[clave] || PLANTILLAS.comercio;
export const pesos = n => "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");

/**
 * Costo y margen de un servicio o producto.
 * Servicios: insumos + parte de los gastos fijos según el tiempo (por hora ocupada) + comisión.
 * Resto: costo unitario; los fijos se cubren con el margen (ver punto de equilibrio).
 */
export function costear(item, negocio, fijosMes) {
  const p = plantilla(negocio.plantilla);
  const precio = Number(item.precio) || 0, costo = Number(item.costo) || 0;
  const meta = (negocio.margen_objetivo ?? 35) / 100;
  if (p.usaTiempo && item.minutos) {
    const horas = Math.max(1, negocio.puestos * negocio.horas_mes * Math.max(0.05, negocio.ocupacion / 100));
    const fijoHora = fijosMes / horas;
    const com = Math.min(0.9, (negocio.comision || 0) / 100);
    const base = fijoHora * item.minutos / 60 + costo;
    const total = base + precio * com;
    return { total, ganancia: precio - total, margen: precio ? (precio - total) / precio : 0, sugerido: base * (1 + meta) / (1 - com), fijoHora };
  }
  return { total: costo, ganancia: precio - costo, margen: precio ? (precio - costo) / precio : 0, sugerido: costo * (1 + meta) / Math.max(0.1, 1 - meta) };
}
