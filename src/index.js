import { descargarReporte } from './loginDownload.js';
import { obtenerFaltantes } from './parseExcel.js';
import { enviarAviso } from './sendMail.js';
import fs from 'fs/promises';

const CODIGOS_FICHA = ['2671841', '2627096', '3138270']; // Fichas a revisar

async function procesarFicha(codigo) {
  console.log(`Procesando ficha ${codigo}...`);
  const archivo = await descargarReporte(codigo);
  const faltantes = await obtenerFaltantes(archivo);

  for (const est of faltantes) {
    console.log(`Avisando a ${est.correo}`);
    await enviarAviso(est.correo, est.nombre, codigo);
  }

  await registrarResultado(codigo, faltantes.length);
}

async function registrarResultado(codigo, faltan) {
  const DATA_FILE = './data/resultados.json';
  let datos = { fichas: [] };

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    datos = JSON.parse(raw);
  } catch (_) {}

  const total = faltan; // supuesto que no conocemos el total; ajusta según el Excel
  const entry = { codigo, faltantes: faltan, completos: total - faltan };
  datos.fichas = datos.fichas.filter(f => f.codigo !== codigo);
  datos.fichas.push(entry);

  await fs.mkdir('./data', { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(datos, null, 2));
}

async function main() {
  for (const ficha of CODIGOS_FICHA) {
    await procesarFicha(ficha);
  }
}

main();