import ExcelJS from 'exceljs';

export async function obtenerFaltantes(rutaArchivo) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(rutaArchivo);
  const sheet = workbook.getWorksheet(1);

  const faltantes = [];
  sheet.eachRow((row, rowNum) => {
    const cod = row.getCell(1).text.trim();
    const nombre = row.getCell(2).text.trim();
    const correo = row.getCell(3).text.trim();
    const juicio = row.getCell(5).text.trim();

    if (!juicio) {
      faltantes.push({ cod, nombre, correo });
    }
  });
  return faltantes;
}