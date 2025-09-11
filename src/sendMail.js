import nodemailer from 'nodemailer';
import { cfg } from './config.js';

const transporter = nodemailer.createTransport({
  host: cfg.smtpHost,
  port: cfg.smtpPort,
  secure: false,
  auth: { user: cfg.emailUser, pass: cfg.emailPass }
});

export async function notificarInstructor(destino, ficha, scheduleId) {
  await transporter.sendMail({
    from: `"Coordinación" <${cfg.emailUser}>`,
    to: destino,
    subject: `Juicios completados - Ficha ${ficha}`,
    text: `Se registraron todos los juicios de evaluación para la ficha ${ficha}.\nSchedule: ${scheduleId}.`
  });
}