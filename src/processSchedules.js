import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';
import { ReporteDiario } from './models/ReporteDiario.js';
import { cfg } from './config.js';
import { descargarJuicios } from './stubs.js';
import { enviarCorreo } from './sendMail.js';
import { fileURLToPath } from 'url';

const SCHEDULES_SIN_FICHA_KEY = '__sinFicha__';
const DIAS_POSTERIORES_FEND = 5;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const normalizarFecha = (fecha) => {
  if (!fecha) return undefined;
  if (fecha instanceof Date) {
    return Number.isNaN(fecha.getTime()) ? undefined : fecha;
  }

  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * Dependencias externas proporcionadas por Repfora.
 * @typedef {Object} RepforaDependencies
 * @property {Function} dbConnection - Manejador de conexión a la base de datos.
 * @property {typeof Schedule} Schedule - Modelo de schedule.
 * @property {typeof ReporteDiario} ReporteDiario - Modelo para reportes diarios.
 * @property {Function} descargarJuicios - Servicio para obtener juicios de un schedule.
 * @property {Function} enviarCorreo - Servicio para enviar notificaciones por correo.
 */

/**
 * Obtiene los schedules pendientes agrupados por ficha.
 * @returns {Promise<Record<string, any[]>>} Schedules pendientes agrupados. Los que no
 * tienen ficha.number se registran bajo la clave definida en SCHEDULES_SIN_FICHA_KEY.
 */
export async function obtenerSchedulesPendientes(fechaReferencia = new Date()) {
  // TODO Repfora
  const limiteFend = new Date(fechaReferencia.getTime() - DIAS_POSTERIORES_FEND * MS_POR_DIA);
  const schedules = await Schedule.find({
    calificado: { $ne: true },
    fend: { $lt: limiteFend }
  })
    .populate('ficha', 'number')
    .lean();
  const agrupados = {};
  const sinFicha = [];

  for (const sched of schedules) {
    if (sched?.ficha?.number) {
      const numero = sched.ficha.number;
      agrupados[numero] = agrupados[numero] || [];
      agrupados[numero].push(sched);
    } else {
      sinFicha.push(sched);
    }
  }

  if (sinFicha.length > 0) {
    console.warn(
      `Se encontraron ${sinFicha.length} schedules sin ficha.number durante la obtención de pendientes.`
    );
    agrupados[SCHEDULES_SIN_FICHA_KEY] = sinFicha;
  }

  return agrupados;
}

/**
 * Actualiza un schedule marcándolo como calificado en la base de datos.
 * @param {Object} schedule - Documento del schedule a actualizar.
 * @param {Date} fechaCalificacion - Fecha en la que fue calificado.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function actualizarSchedule(schedule, fechaCalificacion) {
  // TODO Repfora
  if (!schedule?._id) return;
  const fecha = normalizarFecha(fechaCalificacion) ?? new Date();
  await Schedule.updateOne(
    { _id: schedule._id },
    { $set: { calificado: true, fechaCalificacion: fecha } }
  );
}

/**
 * Registra un reporte diario para el schedule procesado.
 * @param {Object} schedule - Schedule asociado.
 * @param {Object} params - Datos del reporte.
 * @param {Date} params.fechaCalificacion - Fecha asociada al evento.
 * @param {string} params.estado - Estado resultante del procesamiento.
 * @param {Object} params.info - Información adicional a almacenar.
 * @returns {Promise<void>}
 */
async function registrarReporte(schedule, { fechaCalificacion, estado, info }) {
  if (!schedule?._id) return;
  const fecha = normalizarFecha(fechaCalificacion) ?? new Date();
  const ficha = schedule?.ficha?.number;

  await ReporteDiario.create({
    fechaCalificacion: fecha,
    scheduleId: schedule._id,
    ficha: ficha != null ? String(ficha) : undefined,
    estado,
    info
  });
}

/**
 * Procesa un schedule descargando sus juicios y actualizándolo si procede.
 * @param {Object} schedule - Schedule a procesar.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function procesarSchedule(schedule) {
  // TODO Repfora
  if (!schedule.ficha || !schedule.ficha.number) {
    console.warn(`Schedule ${schedule._id} sin ficha asociada`);
    return;
  }
  const juicios = await descargarJuicios({
    ...schedule,
    ficha: schedule.ficha.number
  });
  const {
    calificado,
    porEvaluar,
    tienePendientes,
    total,
    aprobados,
    faltantes,
    fechaCalificacion: fechaCalificacionSofia
  } = juicios ?? {};

  const infoReporte = {
    total: total ?? null,
    porEvaluar: porEvaluar ?? null,
    aprobados: aprobados ?? null,
    faltantes: faltantes ?? null,
    tienePendientes: tienePendientes ?? null
  };

  if (calificado) {
    const fecha = normalizarFecha(fechaCalificacionSofia) ?? new Date();
    await actualizarSchedule(schedule, fecha);
    await registrarReporte(schedule, {
      fechaCalificacion: fecha,
      estado: 'calificado',
      info: infoReporte
    });
    console.log(`Schedule ${schedule._id} marcado como calificado.`);
  } else {
    let notificacionEnviada = false;
    if (schedule.instructorCorreo && cfg.mailEnabled) {
      const mensajePendiente = typeof porEvaluar === 'number'
        ? `A la fecha todavía existen ${porEvaluar} juicios pendientes de calificación.`
        : 'El reporte más reciente indica que aún hay juicios pendientes por registrar.';

      try {
        await enviarCorreo(schedule.instructorCorreo, {
          scheduleId: schedule._id,
          fechaCalificacion: new Date(),
          asunto: `Juicios pendientes - Ficha ${schedule.ficha.number}`,
          mensaje: [
            `El schedule ${schedule._id} correspondiente a la ficha ${schedule.ficha.number} continúa sin calificar.`,
            mensajePendiente
          ].join(' ')
        });
        notificacionEnviada = true;
      } catch (error) {
        console.error(`No se pudo enviar correo al instructor del schedule ${schedule._id}:`, error);
      }
    }

    const infoPendiente = {
      ...infoReporte,
      notificacionEnviada
    };

    await registrarReporte(schedule, {
      fechaCalificacion: new Date(),
      estado: 'pendiente',
      info: infoPendiente
    });

    const pendientes = typeof porEvaluar === 'number'
      ? porEvaluar > 0
      : typeof tienePendientes === 'boolean'
        ? tienePendientes
        : undefined;

    if (typeof porEvaluar === 'number') {
      if (porEvaluar > 0) {
        console.log(
          `Schedule ${schedule._id} sin calificar. Juicios pendientes: ${porEvaluar}.`
        );
      } else {
        console.log(
          `Schedule ${schedule._id} sin calificar. Sin juicios de evaluación pendientes.`
        );
      }
    } else if (pendientes === true) {
      console.log(
        `Schedule ${schedule._id} sin calificar. Tiene juicios de evaluación pendientes.`
      );
    } else if (pendientes === false) {
      console.log(
        `Schedule ${schedule._id} sin calificar. No tiene juicios de evaluación pendientes.`
      );
    } else {
      console.log(
        `Schedule ${schedule._id} sin calificar. No se pudo determinar si tiene juicios de evaluación pendientes.`
      );
    }
  }
}

/**
 * Función principal del procesamiento de schedules.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function main() {
  // TODO Repfora
  console.log('Estableciendo conexión a la base de datos...');
  const connected = await dbConnection();
  if (!connected) {
    console.log('No se pudo establecer la conexión.');
    return;
  }
  console.log('Conexión establecida.');
  const pendientes = await obtenerSchedulesPendientes();
  const total = Object.values(pendientes).reduce((acc, group) => acc + group.length, 0);
  if (total === 0) {
    console.log('No hay schedules pendientes.');
    return;
  }
  console.log(`Procesando ${total} schedules.`);
  for (const group of Object.values(pendientes)) {
    for (const sched of group) {
      await procesarSchedule(sched);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(() => process.exit(0));
}