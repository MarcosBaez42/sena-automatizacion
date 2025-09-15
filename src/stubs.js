import { cfg } from './config.js';
import { iniciarSesion, descargarReporte } from './loginDownload.js';
import { obtenerFaltantes } from './parseExcel.js';

let session;

/**
 * Consulta el servicio externo que provee los juicios para un schedule.
 * @param {Object} schedule - Documento del schedule a consultar.
 * @returns {Promise<any>} Respuesta del servicio de juicios.
 */
export async function descargarJuicios(schedule) {
  if (cfg.juiciosApiUrl) {
    const url = `${cfg.juiciosApiUrl}/schedules/${schedule._id}/juicios`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Error al obtener juicios: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }

  if (!schedule.fiche) {
    console.warn(`Schedule ${schedule._id} no tiene ficha definida`);
    return { calificado: false };
  }

  if (!session) {
    session = await iniciarSesion();
  }

  const codigoFicha = schedule.fiche.toString();
  const filePath = await descargarReporte(session.page, codigoFicha);
  const { porEvaluar } = await obtenerFaltantes(filePath);
  return { calificado: porEvaluar === 0 };
}