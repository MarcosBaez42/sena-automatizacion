import nodemailer from 'nodemailer';
import { cfg } from './config.js';

const transporter = nodemailer.createTransport({
  host: cfg.smtpHost,
  port: cfg.smtpPort,
  secure: false,
  auth: { user: cfg.emailUser, pass: cfg.emailPass }
});

export async function enviarAviso(destino, nombre, ficha) {
  await transporter.sendMail({
    from: `"Coordinación" <${cfg.emailUser}>`,
    to: destino,
    subject: `Juicio evaluativo pendiente - Ficha ${ficha}`,
    text: `Hola ${nombre},\n\nNo encontramos tu juicio evaluativo para la ficha ${ficha}. Por favor revisa en Sofía Plus.\n\nSaludos`
  });
}