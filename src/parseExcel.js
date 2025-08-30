import xlsx from 'xlsx';

export function obtenerFaltantes(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const faltantes = [];
  rows.forEach((row) => {
    const cod = (row[0] || '').toString().trim();
    const nombre = (row[1] || '').toString().trim();
    const correo = (row[2] || '').toString().trim();
    const juicio = (row[4] || '').toString().trim();

    if (cod && nombre && correo && !juicio) {
      faltantes.push({ cod, nombre, correo });
    }
  });

  return faltantes;
}