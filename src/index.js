import { iniciarSesion, descargarReporte } from './loginDownload.js';
import { obtenerFaltantes } from './parseExcel.js';
import { enviarAviso } from './sendMail.js';
import fs from 'fs/promises';

const CODIGOS_FICHA = ['2671841', '2627096', '3138270'];

async function procesarFicha(page, codigo) {
  console.log(`Procesando ficha ${codigo}...`);
  const archivo = await descargarReporte(page, codigo);
  const { total, faltantes, porEvaluar, aprobados } = await obtenerFaltantes(archivo);

  console.log(`Ficha ${codigo} - ${porEvaluar} aprendices con juicio pendiente.`);
  
  // Como el archivo .xls no tiene correo, no se pueden enviar los avisos.
  // Se imprime en consola la lista de aprendices por evaluar.
  console.log('Aprendices con juicio pendiente:');
  for (const est of faltantes) {
    console.log(`- ${est.nombre} (${est.cod})`);
  }

  // Comentar la siguiente línea ya que no se puede enviar el correo sin la dirección
  // for (const est of faltantes) {
  //   await enviarAviso(est.correo, est.nombre, codigo);
  // }

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
    for (const codigo of CODIGOS_FICHA) {
      await procesarFicha(page, codigo);
    }
  } finally {
    await browser.close();
  }
})();