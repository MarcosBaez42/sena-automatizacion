/**
 * Almacén temporal en memoria para juicios por schedule.
 * @type {Map<string, {calificado: boolean, datos?: any}>}
 */
const juiciosMemoria = new Map();

/**
 * Descarga los juicios de un schedule. Mantiene los datos solo en memoria.
 * Registra "pendiente" en consola cuando no hay calificación.
 * @param {Object} schedule - Documento del schedule a consultar.
 * @returns {Promise<{calificado: boolean, datos?: any}>} Juicios del schedule.
 */
export async function descargarJuicios(schedule) {
  const info = juiciosMemoria.get(schedule._id?.toString());
  if (!info?.calificado) {
    console.log('pendiente');
  }
  return info ?? { calificado: false };
}

/**
 * Envía un correo al instructor con información de calificación.
 * @param {string} instructor - Correo del instructor.
 * @param {Object} datos - Datos adicionales para el mensaje.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function enviarCorreo(instructor, datos) {
  console.log(`Correo a ${instructor}:`, datos);
}

export { juiciosMemoria };