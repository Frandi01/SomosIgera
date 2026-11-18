export const safePath = p => (typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/cursos");
export const ERRORES = {
  datos: "Completá todos los campos.",
  email: "Revisá el mail: le falta algo (ej: nombre@gmail.com).",
  corta: "La contraseña tiene que tener al menos 8 caracteres, con letras y números.",
  existe: "Ya hay una cuenta con ese mail. Ingresá con tu contraseña.",
  login: "El mail o la contraseña no coinciden.",
  intentos: "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  link: "El link venció o ya se usó. Pedile uno nuevo al equipo.",
  permiso: "Tu cuenta no tiene acceso a esa sección.",
  actual: "La contraseña actual no es correcta.",
  repetir: "Las dos contraseñas nuevas no coinciden.",
  codigo: "Ese código no es válido o ya se usó. Lo recibís al completar la encuesta de la jornada; si tenés problemas, escribinos.",
};

export const passwordValida = p => typeof p === "string" && p.length >= 8 && p.length <= 200 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);
