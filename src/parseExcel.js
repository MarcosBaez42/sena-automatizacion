import xlsx from 'xlsx';

 export async function obtenerFaltantes(rutaArchivo) {
   const workbook = xlsx.readFile(rutaArchivo);
   const worksheet = workbook.Sheets[workbook.SheetNames[0]];
   const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

   const faltantes = [];
   const juiciosFaltantes = ['por evaluar']; // comparar en minúsculas
   let total = 0;
   let porEvaluar = 0;
   let aprobados = 0;

   for (const row of rows) {
     const cod = (row[0] || '').toString().trim();
     const nombre = (row[1] || '').toString().trim();
     const correo = (row[2] || '').toString().trim();
     const juicio = (row[4] || '').toString().trim().toLowerCase();

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