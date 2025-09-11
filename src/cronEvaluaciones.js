import { iniciarSesion, descargarReporte } from './loginDownload.js';
import { obtenerFaltantes } from './parseExcel.js';
import { notificarInstructor } from './sendMail.js';
import { fileURLToPath } from 'url';
import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';
import { Reporte } from './models/Reporte.js';

const CINCO_DIAS = 5 * 24 * 60 * 60 * 1000;

export async function evaluarSchedulesPendientes({ dbConnection, Schedule, Reporte }) {
  const connected = await dbConnection();
  if (!connected) {
    console.log('DB not connected, skipping evaluation');
    return;
  }
  const limite = new Date(Date.now() - CINCO_DIAS);
  const schedules = await Schedule.find({
    calificado: false,
    fend: { $lt: limite }
  }).lean();

  const schedulesPorFicha = schedules.reduce((acc, sched) => {
    acc[sched.ficha] = acc[sched.ficha] || [];
    acc[sched.ficha].push(sched);
    return acc;
  }, {});

  if (Object.keys(schedulesPorFicha).length === 0) return;

  const { browser, page } = await iniciarSesion();
  try {
    for (const [ficha, items] of Object.entries(schedulesPorFicha)) {
      const archivo = await descargarReporte(page, ficha);
      const { total, faltantes, porEvaluar, aprobados } = await obtenerFaltantes(archivo);

      if (porEvaluar === 0) {
        for (const sched of items) {
          await Schedule.updateOne(
            { _id: sched._id },
            {
              $set: {
                calificado: true,
                fechaCalificacion: new Date()
              }
            }
          );

          if (sched.instructorCorreo) {
            await notificarInstructor(
              sched.instructorCorreo,
              ficha,
              sched._id.toString()
            );
          }

          await Reporte.create({
            fecha: new Date(),
            scheduleId: sched._id,
            ficha,
            info: { total, porEvaluar, aprobados, faltantes }
          });
        }
      }
    }
  } finally {
    await browser.close();
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    await evaluarSchedulesPendientes({ dbConnection, Schedule, Reporte });
    process.exit(0);
  })();
}