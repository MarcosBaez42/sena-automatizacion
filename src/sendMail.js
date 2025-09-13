import nodemailer from 'nodemailer';
import { cfg } from './config.js';

const transporter = nodemailer.createTransport({
  host: cfg.smtpHost,
  port: cfg.smtpPort,
  secure: false,
  auth: { user: cfg.emailUser, pass: cfg.emailPass }
});

/**
 * Envía un correo usando el proveedor configurado.
 * @param {string} destino - Correo del instructor.
 * @param {{scheduleId: string, fechaCalificacion: Date, asunto?: string, mensaje?: string}} datos - Datos para el correo.
 * @returns {Promise<void>}
 */
export async function enviarCorreo(destino, datos) {
  const fecha = datos.fechaCalificacion instanceof Date
    ? datos.fechaCalificacion.toISOString()
    : new Date().toISOString();
  const subject = datos.asunto || `Juicios completados - Schedule ${datos.scheduleId}`;
  const text = datos.mensaje || `Se registraron todos los juicios de evaluación para el schedule ${datos.scheduleId} el ${fecha}.`;
  await transporter.sendMail({
    from: `"Coordinación" <${cfg.emailUser}>`,
    to: destino,
    subject,
    text
  });
}

export async function notificarInstructor(destino, ficha, scheduleId) {
  await enviarCorreo(destino, {
    scheduleId,
    fechaCalificacion: new Date(),
    asunto: `Juicios completados - Ficha ${ficha}`,
    mensaje: `Se registraron todos los juicios de evaluación para la ficha ${ficha}.\nSchedule: ${scheduleId}.`
  });
}