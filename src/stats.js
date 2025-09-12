import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { iniciarSesion, descargarReporte } from './loginDownload.js';
import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';

const app = express();
const PORT = 3000;

// Supón que guardas los resultados de cada ficha en JSON:
const DATA_FILE = './data/resultados.json';
const CINCO_DIAS = 5 * 24 * 60 * 60 * 1000;

app.use(express.static('public'));

app.get('/datos', async (_req, res) => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.json({ fichas: [] });
  }
});

app.get('/pendientes', async (_req, res) => {
  try {
    const connected = await dbConnection();
    if (!connected) return res.json({ fichas: [] });
    const limite = new Date(Date.now() - CINCO_DIAS);
    const schedules = await Schedule.find({
      calificado: false,
      fend: { $lt: limite }
    }).lean();
    const fichas = [...new Set(schedules.map(s => s.ficha))];
    res.json({ fichas });
  } catch (err) {
    res.json({ fichas: [] });
  }
});

app.get('/descargar/:ficha', async (req, res) => {
  const { ficha } = req.params;
  const { browser, page } = await iniciarSesion();
  try {
    const filePath = await descargarReporte(page, ficha);
    res.download(path.resolve(filePath), async err => {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('Error cerrando navegador:', closeErr);
      }
      if (err) {
        console.error('Error enviando archivo:', err);
      }
    });
  } catch (e) {
    try {
      await browser.close();
    } catch (closeErr) {
      console.error('Error cerrando navegador:', closeErr);
    }
    res.status(500).json({ error: 'No se pudo descargar el reporte' });
  }
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => console.log(`Servidor estadísticas http://localhost:${PORT}`));