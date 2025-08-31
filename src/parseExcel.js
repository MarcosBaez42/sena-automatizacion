import xlsx from 'xlsx';

const limpiarTexto = (texto = '') =>
  texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export async function obtenerFaltantes(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const faltantes = [];
  const juiciosFaltantes = ['por evaluar']; // comparar en minúsculas
  let total = 0;
  let porEvaluar = 0;
  let aprobados = 0;

  if (rows.length === 0) {
    return { total, faltantes, porEvaluar, aprobados };
  }

    const headers = rows[0].map((h) => limpiarTexto(h));
    const idxCod = headers.findIndex(
      (h) => h.includes('documento') || h.includes('codigo')
    );
    const idxNombre = headers.findIndex((h) => h.includes('nombre'));
    const idxCorreo = headers.findIndex((h) => h.includes('correo'));
    const idxJuicio = headers.findIndex((h) => h.includes('juicio'));

    const codIndex = idxCod > -1 ? idxCod : 0;
    const nombreIndex = idxNombre > -1 ? idxNombre : 1;

    for (const row of rows.slice(1)) {
      const cod = (row[codIndex] || '').toString().trim();
      const nombre = (row[nombreIndex] || '').toString().trim();
      const correo = (row[idxCorreo > -1 ? idxCorreo : 2] || '')
        .toString()
        .trim();
      const juicio = (row[idxJuicio > -1 ? idxJuicio : 4] || '')
        .toString()
        .trim()
        .toLowerCase();

      // Cuenta el aprendiz aunque no tenga correo
      if (cod && nombre) {
        total++;
        if (juicio.includes('por evaluar')) {
          porEvaluar++;
          if (correo) faltantes.push({ cod, nombre, correo }); // lista para avisos
        } else if (juicio.startsWith('aprob')) {
          aprobados++;
        }
      }
    }

  return { total, faltantes, porEvaluar, aprobados };
}
