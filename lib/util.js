export const safePath = p => (typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/cursos");
export const ERRORES = {
  datos: "Completá todos los campos.",
  email: "Revisá el mail: le falta algo (ej: nombre@gmail.com).",
  corta: "La contraseña tiene que tener al menos 8 caracteres.",
  existe: "Ya hay una cuenta con ese mail. Ingresá con tu contraseña.",
  login: "El mail o la contraseña no coinciden.",
  intentos: "Demasiados intentos. Esperá 15 minutos y probá de nuevo.",
  link: "El link venció o ya se usó. Pedile uno nuevo al equipo.",
  permiso: "Tu cuenta no tiene acceso a esa sección.",
};
