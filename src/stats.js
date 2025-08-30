import express from 'express';
import fs from 'fs/promises';

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

app.listen(PORT, () => console.log(`Servidor estadísticas http://localhost:${PORT}`));