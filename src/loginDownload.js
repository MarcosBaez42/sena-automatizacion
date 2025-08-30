import { chromium } from 'playwright';
import fs from 'fs/promises';
import { cfg } from './config.js';
import path from 'path';

export async function descargarReporte(codigoFicha) {
  const browser = await chromium.launch({ headless: true });
  try {
  const page = await browser.newPage();

  await page.goto('http://senasofiaplus.edu.co/sofia-public/');

  await page.waitForSelector('#usuario', { timeout: 60000 });
  await page.fill('#usuario', cfg.sofiaUser);
  await page.fill('#clave', cfg.sofiaPass);
  await page.click('#btnIngresar');

  await page.getByText('Lista de Roles').click();
  await page.getByText('Gestión Desarrollo Curricular').click();
  await page.getByText('Ejecución de la Formación').click();
  await page.getByText('Administrar Ruta de Aprendizaje').click();
  await page.getByText('Reportes').click();
  await page.getByText('Reporte de Juicios de Evaluación').click();
  await page.getByText('Buscar Ficha de Caracterización').click();

  await page.fill('#codigoFicha', codigoFicha);
  await page.click('#btnBuscarFicha');
  await page.click('#btnAgregar');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btnGenerarReporte')
  ]);

  const filePath = path.join(cfg.outputDir, await download.suggestedFilename());
  await fs.mkdir(cfg.outputDir, { recursive: true });
  await download.saveAs(filePath);

  return filePath;
  } catch (error) {
    console.error('Error al descargar el reporte:', error);
    throw error;
  } finally {
    await browser.close();
  }
}