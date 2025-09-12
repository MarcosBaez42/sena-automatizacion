import { iniciarSesion, descargarReporte } from './loginDownload.js';
import { obtenerFaltantes } from './parseExcel.js';
import { notificarInstructor } from './sendMail.js';
import { cfg } from './config.js';
import fs from 'fs/promises';

async function procesarFicha(page, codigo) {
  console.log(`Procesando ficha ${codigo}...`);
  const archivo = await descargarReporte(page, codigo);
  const { total, faltantes, porEvaluar, aprobados } = await obtenerFaltantes(archivo);

  console.log(`Ficha ${codigo} - ${porEvaluar} aprendices con juicio pendiente.`);
  
  console.log('Aprendices con juicio pendiente:');
  for (const est of faltantes) {
    console.log(`- ${est.nombre} (${est.cod})`);
  }

  if (cfg.mailEnabled) {
    for (const est of faltantes) {
      await notificarInstructor(est.correo, codigo, est.cod);
    }
  }

  await registrarResultado(codigo, total, porEvaluar, aprobados);
}

async function registrarResultado(codigo, total, porEvaluar, aprobados) {
  const DATA_FILE = './data/resultados.json';
  let datos = { fichas: [] };

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    datos = JSON.parse(raw);
  } catch (_) {}

  const entry = { codigo, total, porEvaluar, aprobados };

  datos.fichas = datos.fichas.filter(f => f.codigo !== codigo);
  datos.fichas.push(entry);

  await fs.writeFile(DATA_FILE, JSON.stringify(datos, null, 2), 'utf8');
}

(async () => {
  const { browser, page } = await iniciarSesion();
  try {
    for (const codigo of cfg.codigosFicha) {
      await procesarFicha(page, codigo);
    }
  } finally {
    await browser.close();
  }
})();