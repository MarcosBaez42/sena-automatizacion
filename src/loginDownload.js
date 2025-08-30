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
  try {
    await page.waitForSelector('text=Lista de Roles', { timeout: 15000 });
  } catch (e) {
    throw new Error('Credenciales inválidas o fallo en el login');
  }

  await page.getByRole('combobox', { name: 'Lista de Roles' }).click();
  await page.waitForSelector('#seleccionRol\\:roles');
  await page.selectOption('#seleccionRol\\:roles', { value: '17' });
  await page.waitForSelector('text=Ejecución de la Formación');

  await page.getByRole('link', { name: 'Ejecución de la Formación' }).click();
  await page.waitForSelector('text=Administrar Ruta de Aprendizaje');

  await page.getByRole('link', { name: 'Administrar Ruta de Aprendizaje' }).click();
  await page.waitForSelector('text=Reportes');

  await page.getByRole('link', { name: 'Reportes' }).click();
  await page.waitForSelector('text=Reporte de Juicios de Evaluación');

  await page
    .getByRole('link', { name: 'Reporte de Juicios de Evaluación' })
    .click();
  await page.waitForSelector('text=Buscar Ficha de Caracterización');

  await page
    .getByRole('link', { name: 'Buscar Ficha de Caracterización' })
    .click();
  await page.waitForSelector('#codigoFicha');

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