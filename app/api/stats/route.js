import { q } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const { rows } = await q("select coalesce(sum(asistentes),0)::int n from inscripciones");
  return Response.json({ inscriptos: rows[0].n }, { headers: { "Cache-Control": "max-age=60" } });
}
