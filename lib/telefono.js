// Normalización de teléfonos argentinos para WhatsApp. Tomado de DAIA (lib/whatsapp/phone.ts).
export const soloDigitos = s => String(s || "").replace(/\D/g, "");

// Forma nacional: sin 00, sin 54, sin el 9 de celular, sin 0 inicial y sin 15 local.
// "0221 15-596-1310" y "+54 9 221 596-1310" terminan ambos en "2215961310".
export function nacional(raw) {
  let d = soloDigitos(raw).replace(/^00/, "");
  if (!d) return "";
  if (d.startsWith("54")) { d = d.slice(2); if (d.startsWith("9")) d = d.slice(1); }
  d = d.replace(/^0/, "");
  for (const area of [2, 3, 4]) {
    if (d.length > area + 2 && d.slice(area, area + 2) === "15") {
      const sin15 = d.slice(0, area) + d.slice(area + 2);
      if (sin15.length === 10) return sin15;
    }
  }
  return d;
}
// wa_id / número para wa.me: 549 + área + abonado.
export const aWaId = raw => { const n = nacional(raw); return n.length === 10 ? "549" + n : null; };
// "+54 9 221 596-1310". Área de 2 dígitos para CABA/AMBA (11) y de 3 para el resto: es solo
// para mostrar, el número que se marca es el wa_id completo.
export function display(waId) {
  const n = nacional(waId);
  if (n.length !== 10) return "";
  const area = n.startsWith("11") ? 2 : 3;
  const a = n.slice(0, area), r = n.slice(area);
  return `+54 9 ${a} ${r.slice(0, r.length - 4)}-${r.slice(-4)}`;
}
