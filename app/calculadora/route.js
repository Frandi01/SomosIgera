// Calculadora de costos para salones (página propia, fuera del inicio).
import { pagina } from "@/lib/estatica";
export const dynamic = "force-dynamic";
export const GET = req => pagina("calculadora.html", req);
