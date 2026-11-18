// La calculadora ahora vive dentro de "Mi negocio" y arranca con los datos de cada uno.
export const dynamic = "force-dynamic";
export const GET = () => new Response(null, { status: 308, headers: { Location: "/negocio/calculadora" } });
