import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';
import { ReporteDiario } from './models/ReporteDiario.js';
import { descargarJuicios } from './stubs.js';
import { enviarCorreo } from './sendMail.js';
import { fileURLToPath } from 'url';

const SCHEDULES_SIN_FICHA_KEY = '__sinFicha__';

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
export async function obtenerSchedulesPendientes() {
  // TODO Repfora
  const schedules = await Schedule.find({
    calificado: { $ne: true }
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
 * Actualiza un schedule como calificado y registra en reportes_diarios.
 * @param {Object} schedule - Documento del schedule a actualizar.
 * @param {Date} fechaCalificacion - Fecha en la que fue calificado.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function actualizarSchedule(schedule, fechaCalificacion) {
  // TODO Repfora
  if (!schedule?.ficha?.number) return;
  await Schedule.updateOne(
    { _id: schedule._id },
    { $set: { calificado: true, fechaCalificacion } }
  );
  // TODO Repfora
  await ReporteDiario.create({
    fechaCalificacion,
    scheduleId: schedule._id,
    ficha: schedule.ficha.number,
    info: {}
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
  const { calificado, porEvaluar, tienePendientes } = await descargarJuicios({
    ...schedule,
    ficha: schedule.ficha.number
  });
  if (calificado) {
    const fecha = new Date();
    await actualizarSchedule(schedule, fecha);
    console.log(`Schedule ${schedule._id} marcado como calificado.`);
    if (schedule.instructorCorreo) {
      // TODO Repfora
      await enviarCorreo(schedule.instructorCorreo, {
        scheduleId: schedule._id,
        fechaCalificacion: fecha
      });
    }
  } else {
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