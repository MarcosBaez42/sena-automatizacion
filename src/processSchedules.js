import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';
import { ReporteDiario } from './models/ReporteDiario.js';
import { descargarJuicios, enviarCorreo } from './stubs.js';
import { fileURLToPath } from 'url';

/**
 * Dependencias externas proporcionadas por Repfora.
 * @typedef {Object} RepforaDependencies
 * @property {Function} dbConnection - Manejador de conexión a la base de datos.
 * @property {typeof Schedule} Schedule - Modelo de schedule.
 * @property {typeof ReporteDiario} ReporteDiario - Modelo para reportes diarios.
 * @property {Function} descargarJuicios - Servicio para obtener juicios de un schedule.
 * @property {Function} enviarCorreo - Servicio para enviar notificaciones por correo.
 */

const CINCO_DIAS = 5 * 24 * 60 * 60 * 1000;

/**
 * Obtiene los schedules pendientes agrupados por ficha.
 * @returns {Promise<Record<string, any[]>>} Schedules pendientes agrupados.
 */
export async function obtenerSchedulesPendientes() {
  const limite = new Date(Date.now() - CINCO_DIAS);
  // TODO Repfora
  const schedules = await Schedule.find({
    calificado: false,
    fend: { $lt: limite }
  }).lean();
  return schedules.reduce((acc, sched) => {
    acc[sched.ficha] = acc[sched.ficha] || [];
    acc[sched.ficha].push(sched);
    return acc;
  }, {});
}

/**
 * Actualiza un schedule como calificado y registra en reportes_diarios.
 * @param {Object} schedule - Documento del schedule a actualizar.
 * @param {Date} fechaCalificacion - Fecha en la que fue calificado.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function actualizarSchedule(schedule, fechaCalificacion) {
  // TODO Repfora
  await Schedule.updateOne(
    { _id: schedule._id },
    { $set: { calificado: true, fechaCalificacion } }
  );
  // TODO Repfora
  await ReporteDiario.create({
    fechaCalificacion,
    scheduleId: schedule._id,
    ficha: schedule.ficha,
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
  const juicios = await descargarJuicios(schedule);
  if (juicios.calificado) {
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
    console.log(`Schedule ${schedule._id} sin calificar.`);
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