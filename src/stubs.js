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
    const data = await res.json();
    if (typeof data.tienePendientes !== 'boolean') {
      if (typeof data.porEvaluar === 'number') {
        data.tienePendientes = data.porEvaluar > 0;
      } else if (typeof data.calificado === 'boolean') {
        data.tienePendientes = !data.calificado;
      }
    }
    return data;
  }

  if (!schedule.ficha) {
    console.warn(`Schedule ${schedule._id} no tiene schedule.ficha definida`);
    return { calificado: false, porEvaluar: null, tienePendientes: null };
  }

  if (!session) {
    session = await iniciarSesion();
  }

  const ficha = typeof schedule.ficha === 'object'
    ? schedule.ficha.number
    : schedule.ficha;

  if (!ficha) {
    throw new Error(`Schedule ${schedule._id} no tiene ficha definida`);
  }

  const filePath = await descargarReporte(session.page, ficha);
  const { porEvaluar, total, faltantes, aprobados } = await obtenerFaltantes(filePath);
  const calificado = porEvaluar === 0;
  return {
    calificado,
    porEvaluar,
    total,
    aprobados,
    faltantes,
    tienePendientes: !calificado
  };
}