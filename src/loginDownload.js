import { chromium } from 'playwright';
import fs from 'fs/promises';
import { cfg } from './config.js';
import path from 'path';

export async function descargarReporte(codigoFicha) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  try {
    const page = await browser.newPage();

  await page.goto('http://senasofiaplus.edu.co/sofia-public/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#registradoBox1', { timeout: 60000 });

  const fh = await page.$('#registradoBox1');// ajusta el selector
  const frame = await fh.contentFrame();
  await frame.waitForSelector('input#username');
  await frame.getByRole('textbox', { name: 'Número de Documento' }).fill(cfg.sofiaUser);
  await frame.getByRole('textbox', { name: 'Contraseña' }).fill(cfg.sofiaPass);
  await frame.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForSelector('text=Lista de Roles');

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('link', { name: 'Lista de Roles' }).click()
  ]);

  await Promise.all([
    page.waitForNavigation(),
    page.locator('[id="seleccion Rol:roles"]').getByRole('option', { name: 'Gestión Desarrollo Curricular' }).click()
  ]);

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('link', { name: 'Ejecución de la Formación' }).click()
  ]);

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('link', { name: 'Administrar Ruta de Aprendizaje' }).click()
  ]);

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('link', { name: 'Reportes' }).click()
  ]);

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('link', { name: 'Reporte de Juicios de Evaluación' }).click()
  ]);

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('link', { name: 'Buscar Ficha de Caracterización' }).click()
  ]);

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