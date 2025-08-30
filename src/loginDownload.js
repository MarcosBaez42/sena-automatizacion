import { chromium } from 'playwright';
import fs from 'fs/promises';
import { cfg } from './config.js';
import path from 'path';

export async function descargarReporte(codigoFicha) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://senasofiaplus.edu.co/sofia-public/');

  await page.fill('#NumeroDocumento', cfg.sofiaUser);
  await page.fill('#clave', cfg.sofiaPass);
  await page.click('#btnIngresar');

  await page.click('#Lista de Roles');
  await page.click('text=Gestión Desarrollo Curricular');
  await page.click('text=Ejecución de la Formación');
  await page.click('text=Administrar Ruta de Aprendizaje');
  await page.click('text=Reportes');
  await page.click('text=Reporte de Juicios de Evaluación');
  await page.click('#Buscar Ficha de Caracterización');

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

  await browser.close();
  return filePath;
}