// Parseo de la hoja CATEGORIAS del Excel del club (spec 11 + spec 15).
// La columna F ("AÑO") pasó a traer la FECHA de nacimiento completa; se acepta
// también el año suelto (int) para los alumnos que el cliente aún no completó.
import { categoriaDeAnio, categoriaDeFecha } from '@/lib/domain/categoria';

import { kitsDeFila } from './seed-uniformes.mjs';

export const HEADER_ROW = 4;
// Columnas de mes en CATEGORIAS: MAR..NOV (el club nació en marzo 2026).
export const MES_COL = {
  L: 'MAR', M: 'ABR', N: 'MAY', O: 'JUN', P: 'JUL',
  Q: 'AGO', R: 'SEP', S: 'OCT', T: 'NOV',
};

// Relleno de celda de mes → estado del pago. theme9=verde=pagado; theme0/sin
// relleno=no pagado; otro color=desconocido (se reporta, no se adivina).
function estadoCelda(cell) {
  const f = cell.fill;
  if (!f || f.type !== 'pattern' || f.pattern === 'none') return 'vacio';
  const t = f.fgColor?.theme;
  if (t === 9) return 'pagado';
  if (t === 0) return 'vacio';
  return 'desconocido';
}

// Date de Excel (UTC medianoche) → 'YYYY-MM-DD' sin corrimiento de zona.
function fechaISO(v) {
  if (!(v instanceof Date)) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())}`;
}

const texto = (cell) => String(cell.value ?? '').trim();

// Celda F: fecha completa, año suelto, o nada. Devuelve ambos (la fecha manda,
// el año se deriva de ella para no guardar dos verdades distintas).
function nacimientoDeCelda(valor) {
  if (valor instanceof Date) {
    return {
      fechaNacimiento: fechaISO(valor),
      fechaLocal: new Date(
        valor.getUTCFullYear(),
        valor.getUTCMonth(),
        valor.getUTCDate(),
      ),
      anioNacimiento: valor.getUTCFullYear(),
    };
  }
  if (Number.isInteger(valor)) {
    return { fechaNacimiento: null, fechaLocal: null, anioNacimiento: valor };
  }
  return { fechaNacimiento: null, fechaLocal: null, anioNacimiento: null };
}

// Una fila válida o null (con la anomalía ya registrada). La categoría de
// control se calcula por AÑO: es la que reproduce la del Excel.
function parseFila(ws, r, vistos, anomalias) {
  const nombre = texto(ws.getCell(`C${r}`));
  if (nombre === '') return null;
  const hoy = new Date();
  const nac = nacimientoDeCelda(ws.getCell(`F${r}`).value);
  const catAnio =
    nac.anioNacimiento === null
      ? null
      : (categoriaDeAnio(nac.anioNacimiento, hoy)?.etiqueta ?? null);
  const catFecha = nac.fechaLocal
    ? (categoriaDeFecha(nac.fechaLocal, hoy)?.etiqueta ?? null)
    : null;
  const docRaw = ws.getCell(`D${r}`).value;
  const documento = docRaw == null ? '' : String(docRaw).replace(/\D/g, '');
  const catExcel = texto(ws.getCell(`E${r}`));
  const fechaInicio = fechaISO(ws.getCell(`H${r}`).value);

  if (catAnio === null) {
    anomalias.push(`F${r} ${nombre}: nacimiento '${String(ws.getCell(`F${r}`).value)}' fuera de rango (SUB 4–16) → omitida`);
    return null;
  }
  if (documento === '') {
    anomalias.push(`F${r} ${nombre}: documento vacío → omitida`);
    return null;
  }
  if (vistos.has(documento)) {
    anomalias.push(`F${r} ${nombre}: documento ${documento} duplicado (ya en F${vistos.get(documento)}) → omitida`);
    return null;
  }
  // El cross-check contra la categoría del Excel detecta digitación mala, pero
  // vale contra CUALQUIERA de las dos reglas: si el Excel coincide con la de la
  // fecha real, el dato es correcto aunque la del año difiera (spec 15).
  if (catExcel && catExcel !== catAnio && catExcel !== catFecha) {
    anomalias.push(
      `F${r} ${nombre}: categoría Excel '${catExcel}' ≠ por año '${catAnio}'` +
        (catFecha ? ` ni por fecha '${catFecha}'` : '') + ' → omitida',
    );
    return null;
  }
  if (fechaInicio === null) {
    anomalias.push(`F${r} ${nombre}: fecha de inicio (INCIO) inválida → omitida`);
    return null;
  }
  vistos.set(documento, r);

  const mesesPagados = [];
  for (const [col, mes] of Object.entries(MES_COL)) {
    const est = estadoCelda(ws.getCell(`${col}${r}`));
    if (est === 'pagado') mesesPagados.push(mes);
    else if (est === 'desconocido') {
      anomalias.push(`F${r} ${nombre}: relleno de color desconocido en ${mes} → pago omitido`);
    }
  }

  return {
    fila: r,
    nombre,
    documento,
    anioNacimiento: nac.anioNacimiento,
    fechaNacimiento: nac.fechaNacimiento,
    // Categoría real por edad cumplida; puede diferir de la del Excel (spec 15).
    catAnio,
    catFecha,
    acudiente: texto(ws.getCell(`I${r}`)),
    celular: String(ws.getCell(`J${r}`).value ?? '').replace(/\D/g, ''),
    direccion: texto(ws.getCell(`K${r}`)),
    fechaInicio,
    mesesPagados,
    kits: kitsDeFila(ws, r, nombre, anomalias),
  };
}

export function parseFilas(ws, anomalias) {
  const filas = [];
  const vistos = new Map(); // documento → nº de fila
  for (let r = HEADER_ROW + 1; r <= ws.rowCount; r++) {
    const fila = parseFila(ws, r, vistos, anomalias);
    if (fila) filas.push(fila);
  }
  return filas;
}

/** Alumnos cuya categoría por edad cumplida NO es la que tienen en el Excel. */
export function cambiosDeCategoria(filas) {
  return filas.filter((f) => f.catFecha !== null && f.catFecha !== f.catAnio);
}
