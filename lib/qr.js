import "server-only";
import QRCode from "qrcode";
/** QR en SVG, sin dependencias externas en el navegador. */
export const qrSvg = (texto, oscuro = "#211629") =>
  QRCode.toString(texto, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: oscuro, light: "#FFFFFF" } });
