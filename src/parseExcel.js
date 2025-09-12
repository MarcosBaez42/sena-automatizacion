import xlsx from 'xlsx';

const shouldLog = !['0', 'false'].includes(
  (process.env.PARSE_EXCEL_LOGS || '').toLowerCase()
);
const log = (...args) => {
  if (shouldLog) {
    console.log(...args);
  }
};

const limpiarTexto = (texto = '') =>
  texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export async function obtenerFaltantes(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  log('Workbook.SheetNames:', workbook.SheetNames);

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const faltantes = [];
  const juiciosFaltantes = ['por evaluar', 'sin evaluar'];
  let total = 0;
  let porEvaluar = 0;
  let aprobados = 0;

  if (rows.length === 0) {
    return { total, faltantes, porEvaluar, aprobados };
  }

  const headerIndex = rows.findIndex(row => 
    row.some(cell => limpiarTexto(cell).includes('tipo de documento'))
  );

  if (headerIndex === -1) {
    log('No se encontró la fila de encabezados esperada.');
    return { total, faltantes, porEvaluar, aprobados };
  }
  
  const headersRow = rows[headerIndex];
  const headers = headersRow.map((h) => limpiarTexto(h));
  const idxCod = headers.findIndex((h) => h.includes('documento'));
  const idxNombre = headers.findIndex((h) => h.includes('nombre'));
  const idxJuicio = headers.findIndex((h) => h.includes('juicio'));

  log('Fila de encabezados:', headersRow);
  log('Índices -> cod:', idxCod, 'nombre:', idxNombre, 'juicio:', idxJuicio);

  const codIndex = idxCod > -1 ? idxCod : 0;
  const nombreIndex = idxNombre > -1 ? idxNombre : 1;
  const juicioIndex = idxJuicio > -1 ? idxJuicio : 2;

  for (const row of rows.slice(headerIndex + 1)) {
    const cod = (row[codIndex] || '').toString().trim();
    const nombre = (row[nombreIndex] || '').toString().trim();
    const juicio = (row[juicioIndex] || '')
      .toString()
      .trim()
      .toLowerCase();

    if (cod && nombre) {
      total++;
      if (juiciosFaltantes.includes(juicio)) {
        porEvaluar++;
        // No se agrega el campo 'correo' ya que no existe en el archivo
        faltantes.push({ nombre, cod });
      } else if (juicio.includes('aprobado')) {
        aprobados++;
      }
    }
  }

  return { total, faltantes, porEvaluar, aprobados };
}