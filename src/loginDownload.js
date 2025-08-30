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

  const fh = await page.$('#registradoBox1'); // ajusta el selector
  const loginFrame = await fh.contentFrame();
  await loginFrame.waitForSelector('input#username');
  await loginFrame.getByRole('textbox', { name: 'Número de Documento' }).fill(cfg.sofiaUser);
  await loginFrame.getByRole('textbox', { name: 'Contraseña' }).fill(cfg.sofiaPass);
  await loginFrame.getByRole('button', { name: 'Ingresar' }).click();
  try {
    await page.waitForSelector('text=Lista de Roles', { timeout: 15000 });
  } catch (e) {
    throw new Error('Credenciales inválidas o fallo en el login');
  }

  await page.getByRole('combobox', { name: 'Lista de Roles' }).click();
  await page.waitForSelector('#seleccionRol\\:roles');
  await page.selectOption('#seleccionRol\\:roles', { value: '17' });

  const contenidoHandle = await page.waitForSelector('#contenido');
  const frame = await contenidoHandle.contentFrame();
  await frame.waitForSelector('text=Ejecución de la Formación');

  await frame.getByRole('link', { name: 'Ejecución de la Formación' }).click();
  await frame.waitForSelector('text=Administrar Ruta de Aprendizaje');

  await frame.getByRole('link', { name: 'Administrar Ruta de Aprendizaje' }).click();
  await frame.waitForSelector('text=Reportes');

  await frame.getByRole('link', { name: 'Reportes' }).click();
  await frame.waitForSelector('text=Reporte de Juicios de Evaluación');

  await frame
    .getByRole('link', { name: 'Reporte de Juicios de Evaluación' })
    .click();
  await frame.waitForSelector('text=Buscar Ficha de Caracterización');

  await frame
    .getByRole('link', { name: 'Buscar Ficha de Caracterización' })
    .click();
  await frame.waitForSelector('#codigoFicha');

  await frame.fill('#codigoFicha', codigoFicha);
  await frame.click('#btnBuscarFicha');
  await frame.click('#btnAgregar');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.click('#btnGenerarReporte')
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