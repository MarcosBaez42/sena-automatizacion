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

        const fh = await page.$('#registradoBox1'); // iframe del login
        const loginFrame = await fh.contentFrame();
        await loginFrame.waitForSelector('input#username');
        await loginFrame.getByRole('textbox', { name: 'Número de Documento' }).fill(cfg.sofiaUser);
        await loginFrame.getByRole('textbox', { name: 'Contraseña' }).fill(cfg.sofiaPass);
        await loginFrame.getByRole('button', { name: 'Ingresar' }).click();

        // 1) Esperar el combo de roles y seleccionar "Gestión Desarrollo Curricular"
        const ROLE_SELECT = '#seleccionRol\\:roles';
        await page.waitForSelector(ROLE_SELECT, { timeout: 60000 });

        // Opción más robusta: por etiqueta visible
        await page.selectOption(ROLE_SELECT, { label: 'Gestión Desarrollo Curricular' });
        // Si prefieres por value (confirmado en tu sofia.html):
        // await page.selectOption(ROLE_SELECT, { value: '17' });

        // 2) Menú lateral: expandir en el DOM principal (NO dentro del iframe)
        await page.waitForSelector('#side-menu, #menu_lateral', { timeout: 60000 });

        // Abre: Ejecución de la Formación → Administrar Ruta de Aprendizaje → Reportes
        await page.getByRole('link', { name: 'Ejecución de la Formación' }).click();
        await page.getByRole('link', { name: 'Administrar Ruta de Aprendizaje' }).click();
        await page.getByRole('link', { name: 'Reportes ', exact: true }).click();

        // Este sí navega dentro del iframe `contenido`
        await page.getByRole('link', { name: 'Reporte de Juicios de Evaluación', exact: true }).first().click();

        // Re-captura el iframe ya con la página cargada del reporte
        const contenidoHandle2 = await page.waitForSelector('iframe#contenido', { timeout: 60000 });
        let frame2 = await contenidoHandle2.contentFrame();

        // Dentro del iframe: Buscar ficha → llenar → agregar → generar
        await frame2.getByRole('link', { name: 'Buscar Ficha de Caracterización' }).click();

        // Esperar el iframe del buscador y asegurar que cargue su contenido
        const modalHandle = await frame2.waitForSelector('iframe#modalDialogContentviewDialog2', { timeout: 60000 });
        const modalFrame = await modalHandle.contentFrame();
        await modalFrame.waitForSelector('input[id$="codigoFichaITX"]', { timeout: 60000 });

        // Llenar el código de la ficha y agregarlo
        await modalFrame.fill('input[id$="codigoFichaITX"]', codigoFicha);
        await modalFrame.getByRole('button', { name: 'Consultar' }).click();
        await modalFrame.waitForSelector('table[id$="dtFichas"] tbody tr');
        const firstRow = modalFrame.locator('table[id$="dtFichas"] tbody tr').first();
        await firstRow
            .locator('button, a')
            .first()
            .click(); // o selector equivalente del botón “Agregar/Seleccionar”

        try {
            await frame2.waitForLoadState('domcontentloaded');
        } catch {
            const contenidoHandle3 = await page.waitForSelector('iframe#contenido', { timeout: 60000 });
            frame2 = await contenidoHandle3.contentFrame();
        }
        await frame2.waitForSelector('input#frmForma1\\:btnConsultar');

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            frame2.getByRole('button', { name: 'Generar Reporte' }).click(),
        ]);

        const suggested = await download.suggestedFilename();
        const ext = path.extname(suggested);
        const base = path.basename(suggested, ext);
        const finalName = `${base} ${codigoFicha}${ext}`;
        console.log('Nombre sugerido por Sofía:', finalName);

        const filePath = path.join(cfg.outputDir, finalName);
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