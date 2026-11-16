// Control de acceso por rol (como en DAIA lib/auth/rbac.ts): matriz rol × sección × acción.
// Se aplica en 3 capas: proxy (sin sesión no entra al panel), páginas y acciones del servidor
// (el control real) y la interfaz (oculta lo que el rol no puede usar).
// Módulo puro, sin acceso a la base: se puede usar en cualquier componente.

export const SECCIONES = ["inscriptos", "cursos", "usuarios", "configuracion", "aprender", "cuenta"];

const TODO = Object.fromEntries(SECCIONES.map(s => [s, ["manage"]]));

const MATRIZ = {
  // Rol desconocido o inválido: sin acceso a nada (se rechaza por defecto).
  sin_acceso: {},
  admin: TODO,
  // Equipo: trabaja inscriptos y cursos; no toca usuarios ni configuración.
  equipo: {
    inscriptos: ["view", "export"],
    cursos: ["view", "create", "update", "delete"],
    aprender: ["view"],
    cuenta: ["view", "update"],
  },
  alumno: {
    aprender: ["view"],
    cuenta: ["view", "update"],
  },
};

export const ROLES_ASIGNABLES = ["alumno", "equipo", "admin"];

/** Cualquier valor que no sea un rol conocido pasa a sin_acceso. */
export function normalizarRol(rol) {
  return Object.prototype.hasOwnProperty.call(MATRIZ, rol) && rol !== "sin_acceso" ? rol : "sin_acceso";
}

export function puede(rol, seccion, accion = "view") {
  const p = MATRIZ[normalizarRol(rol)][seccion] || [];
  return p.includes("manage") || p.includes(accion);
}

/** Secciones del panel que el rol ve, en el orden de las pestañas. */
export function pestanas(rol) {
  return [
    ["inscriptos", "/panel", "Inscriptos"],
    ["cursos", "/panel/cursos", "Cursos"],
    ["usuarios", "/panel/usuarios", "Usuarios"],
    ["configuracion", "/panel/configuracion", "Configuración"],
  ].filter(([s]) => puede(rol, s));
}

export const accedePanel = rol => pestanas(rol).length > 0;
