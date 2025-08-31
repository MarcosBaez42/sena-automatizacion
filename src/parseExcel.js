import ExcelJS from 'exceljs';

export async function obtenerFaltantes(rutaArchivo) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(rutaArchivo);
  const worksheet = workbook.worksheets[0];

  const faltantes = [];
  worksheet.eachRow((row) => {
    const cod = (row.getCell(1).text || '').trim();
    const nombre = (row.getCell(2).text || '').trim();
    const correo = (row.getCell(3).text || '').trim();
    const juicio = (row.getCell(5).text || '').trim();

    if (cod && nombre && correo && !juicio) {
      faltantes.push({ cod, nombre, correo });
    }
  });

  return faltantes;
}