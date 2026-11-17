// Apagado prolijo (solo en el runtime de Node). Railway manda SIGTERM al reemplazar un deploy o
// reiniciar el servicio. Next.js, por defecto, sale con código 143 (error) y npm lo reporta como
// "command failed": en Railway eso se ve como una caída en cada deploy. Con
// NEXT_MANUAL_SIG_HANDLE=true el apagado se maneja acá: deja terminar los pedidos en curso,
// cierra la base y sale con 0.
let apagando = false;
async function apagar(senal) {
  if (apagando) return;
  apagando = true;
  console.log(`[apagado] ${senal} recibido, cerrando…`);
  await new Promise(r => setTimeout(r, 1500));
  try { await globalThis.__igeraPool?.end(); } catch {}
  console.log("[apagado] listo");
  process.exit(0);
}
if (process.env.NEXT_MANUAL_SIG_HANDLE) {
  process.once("SIGTERM", () => apagar("SIGTERM"));
  process.once("SIGINT", () => apagar("SIGINT"));
}
