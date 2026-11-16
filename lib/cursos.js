export function slugify(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "curso";
}
// Acepta un link de YouTube en cualquier formato (watch, youtu.be, shorts, embed) o el id solo.
export function youtubeId(v) {
  const s = String(v || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
export function safeUrl(v) {
  const s = String(v || "").trim();
  return /^https?:\/\/\S+$/i.test(s) ? s.slice(0, 500) : null;
}
