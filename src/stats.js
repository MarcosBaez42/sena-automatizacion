import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { iniciarSesion, descargarReporte } from './loginDownload.js';
import dbConnection from './database.js';
import { Schedule } from './models/Schedule.js';
import { Program } from './models/Program.js';
import { Fiche } from './models/Fiche.js';

const app = express();
const PORT = 3000;

// Supón que guardas los resultados de cada ficha en JSON:
const DATA_FILE = './data/resultados.json';

app.use(express.static('public'));

app.get('/datos', async (_req, res) => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.json({ fichas: [] });
  }
});

app.get('/programas', async (_req, res) => {
  try {
    const connected = await dbConnection();
    if (!connected) {
      return res.json({ programs: [] });
    }

    const [programs, fiches] = await Promise.all([
      Program.find({ status: { $ne: 1 } })
        .sort({ name: 1 })
        .lean(),
      Fiche.find({ status: { $ne: 1 } })
        .select('number program status')
        .lean()
    ]);

    const fichesByProgram = fiches.reduce((map, fiche) => {
      if (!fiche?.program) return map;
      const id = fiche.program.toString();
      if (!map.has(id)) {
        map.set(id, []);
      }
      if (typeof fiche.number === 'string') {
        map.get(id).push(fiche.number);
      }
      return map;
    }, new Map());

    const response = programs.map(program => {
      const fichas = fichesByProgram.get(program._id.toString()) || [];
      fichas.sort((a, b) => a.localeCompare(b));
      return {
        id: program._id.toString(),
        code: typeof program.code === 'string' ? program.code : '',
        name: typeof program.name === 'string' ? program.name : 'Programa sin nombre',
        version: typeof program.version === 'string' ? program.version : '',
        fiches: fichas,
        ficheCount: fichas.length,
        status: program.status
      };
    });

    for (const [programId, fichas] of fichesByProgram.entries()) {
      if (response.some(p => p.id === programId)) continue;
      fichas.sort((a, b) => a.localeCompare(b));
      response.push({
        id: programId,
        code: '',
        name: 'Programa sin registrar',
        version: '',
        fiches: fichas,
        ficheCount: fichas.length,
        status: null
      });
    }

    response.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      if (nameCompare !== 0) return nameCompare;
      return a.code.localeCompare(b.code);
    });

    res.json({ programs: response });
  } catch (err) {
    console.error('Error obteniendo programas:', err);
    res.status(500).json({ error: 'No se pudieron obtener los programas' });
  }
});

app.get('/pendientes', async (_req, res) => {
  try {
    const connected = await dbConnection();
    if (!connected) return res.json({ fichas: [] });
    const schedules = await Schedule.find({
      calificado: { $ne: true }
    })
      .populate('ficha', 'number')
      .lean();
    const fichas = schedules
      .filter(sched => sched?.ficha?.number)
      .reduce((set, sched) => set.add(sched.ficha.number), new Set());

    res.json({ fichas: [...fichas] });
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