import xlsx from 'xlsx';

export async function obtenerFaltantes(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const faltantes = [];
  const juiciosFaltantes = ['POR EVALUAR'];

  for (const row of rows) {
    const cod = (row[0] || '').toString().trim();
    const nombre = (row[1] || '').toString().trim();
    const correo = (row[2] || '').toString().trim();
    const juicio = (row[4] || '').toString().trim().toLowerCase();

    if (cod && nombre && correo && juiciosFaltantes.includes(juicio)) {
      faltantes.push({ cod, nombre, correo });
    }
  }

  return faltantes;
}