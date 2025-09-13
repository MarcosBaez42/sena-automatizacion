import { cfg } from './config.js';

/**
 * Consulta el servicio externo que provee los juicios para un schedule.
 * @param {Object} schedule - Documento del schedule a consultar.
 * @returns {Promise<any>} Respuesta del servicio de juicios.
 */
export async function descargarJuicios(schedule) {
  if (!cfg.juiciosApiUrl) {
    throw new Error('Variable de entorno JUICIOS_API_URL no configurada');
  }
  const url = `${cfg.juiciosApiUrl}/schedules/${schedule._id}/juicios`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener juicios: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}