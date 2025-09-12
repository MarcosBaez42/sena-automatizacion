import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';
import { ReporteDiario } from './models/ReporteDiario.js';
import { descargarJuicios, enviarCorreo } from './stubs.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const CINCO_DIAS = 5 * 24 * 60 * 60 * 1000;

/**
 * Obtiene los schedules pendientes agrupados por ficha.
 * @returns {Promise<Record<string, any[]>>} Schedules pendientes agrupados.
 */
export async function obtenerSchedulesPendientes() {
  const limite = new Date(Date.now() - CINCO_DIAS);
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
  await Schedule.updateOne(
    { _id: schedule._id },
    { $set: { calificado: true, fechaCalificacion } }
  );
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
  const juicios = await descargarJuicios(schedule);
  if (juicios.calificado) {
    const fecha = new Date();
    await actualizarSchedule(schedule, fecha);
    if (schedule.instructorCorreo) {
      await enviarCorreo(schedule.instructorCorreo, {
        scheduleId: schedule._id,
        fechaCalificacion: fecha
      });
    }
  }
}

/**
 * Función principal del procesamiento de schedules.
 * @returns {Promise<void>} Promesa resuelta al finalizar.
 */
export async function main() {
  process.env.MONGO_URL = process.env.SOFIA_TEST_URI;
  const connected = await dbConnection();
  if (!connected) return;
  const pendientes = await obtenerSchedulesPendientes();
  for (const group of Object.values(pendientes)) {
    for (const sched of group) {
      await procesarSchedule(sched);
    }
  }
}

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const isMain = (typeof module !== 'undefined' && require.main === module) || require.main?.filename === __filename;
if (isMain) {
  main().then(() => process.exit(0));
}