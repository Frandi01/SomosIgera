// Se ejecuta una vez al arrancar el servidor. Ver lib/apagado.js.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./lib/apagado.js");
}
