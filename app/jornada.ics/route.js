const ICS = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Somos Igera//Jornada//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
  "BEGIN:VEVENT", "UID:jornada-salones-20261129@somosigera", "DTSTAMP:20261116T150000Z",
  "DTSTART:20261129T190000Z", "DTEND:20261129T220000Z",
  "SUMMARY:Jornada Somos Igera · Números claros para salones",
  "DESCRIPTION:Jornada gratuita sobre costos\\, administración y marketing para salones. La sede llega por mail.",
  "LOCATION:La Plata\\, Buenos Aires",
  "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:Hoy es la jornada de Somos Igera", "END:VALARM",
  "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
export function GET() {
  return new Response(ICS, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=jornada-somos-igera.ics" } });
}
