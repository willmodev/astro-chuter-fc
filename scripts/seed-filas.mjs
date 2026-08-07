// Parseo de la hoja CATEGORIAS del Excel del club (spec 11 + spec 15).
// La columna F ("AÑO") pasó a traer la FECHA de nacimiento completa; se acepta
// también el año suelto (int) para los alumnos que el cliente aún no completó.
import { categoriaDeAnio, categoriaDeFecha } from '@/lib/domain/categoria';

import { kitsDeFila } from './seed-uniformes.mjs';

export const HEADER_ROW = 4;
// Columnas de mes en CATEGORIAS: MAR..NOV (el club nació en marzo 2026).
export const MES_COL = {
  L: 'MAR',
  M: 'ABR',
  N: 'MAY',
  O: 'JUN',
  P: 'JUL',
  Q: 'AGO',
  R: 'SEP',
  S: 'OCT',
  T: 'NOV',
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

// Columnas crudas de la fila ya normalizadas. La categoría de control se
// calcula por AÑO: es la que reproduce la del Excel.
function datosDeFila(ws, r) {
  const hoy = new Date();
  const crudoF = ws.getCell(`F${r}`).value;
  const nac = nacimientoDeCelda(crudoF);
  const docRaw = ws.getCell(`D${r}`).value;
  return {
    nac,
    crudoF,
    catAnio:
      nac.anioNacimiento === null
        ? null
        : (categoriaDeAnio(nac.anioNacimiento, hoy)?.etiqueta ?? null),
    catFecha: nac.fechaLocal
      ? (categoriaDeFecha(nac.fechaLocal, hoy)?.etiqueta ?? null)
      : null,
    documento: docRaw == null ? '' : String(docRaw).replace(/\D/g, ''),
    catExcel: texto(ws.getCell(`E${r}`)),
    fechaInicio: fechaISO(ws.getCell(`H${r}`).value),
  };
}

// Motivo por el que la fila se omite, o null si es válida.
function motivoDeOmision(d, vistos) {
  if (d.catAnio === null)
    return `nacimiento '${String(d.crudoF)}' fuera de rango (SUB 4–16) → omitida`;
  if (d.documento === '') return 'documento vacío → omitida';
  if (vistos.has(d.documento))
    return `documento ${d.documento} duplicado (ya en F${vistos.get(d.documento)}) → omitida`;
  // El cross-check contra la categoría del Excel detecta digitación mala, pero
  // vale contra CUALQUIERA de las dos reglas: si el Excel coincide con la de la
  // fecha real, el dato es correcto aunque la del año difiera (spec 15).
  if (d.catExcel && d.catExcel !== d.catAnio && d.catExcel !== d.catFecha)
    return (
      `categoría Excel '${d.catExcel}' ≠ por año '${d.catAnio}'` +
      (d.catFecha ? ` ni por fecha '${d.catFecha}'` : '') +
      ' → omitida'
    );
  if (d.fechaInicio === null)
    return 'fecha de inicio (INCIO) inválida → omitida';
  return null;
}

// Meses con relleno verde. El color desconocido se reporta y no cuenta.
function mesesPagadosDeFila(ws, r, nombre, anomalias) {
  const meses = [];
  for (const [col, mes] of Object.entries(MES_COL)) {
    const est = estadoCelda(ws.getCell(`${col}${r}`));
    if (est === 'pagado') meses.push(mes);
    else if (est === 'desconocido') {
      anomalias.push(
        `F${r} ${nombre}: relleno de color desconocido en ${mes} → pago omitido`,
      );
    }
  }
  return meses;
}

// Una fila válida o null (con la anomalía ya registrada).
function parseFila(ws, r, vistos, anomalias) {
  const nombre = texto(ws.getCell(`C${r}`));
  if (nombre === '') return null;
  const d = datosDeFila(ws, r);
  const motivo = motivoDeOmision(d, vistos);
  if (motivo !== null) {
    anomalias.push(`F${r} ${nombre}: ${motivo}`);
    return null;
  }
  vistos.set(d.documento, r);

  return {
    fila: r,
    nombre,
    documento: d.documento,
    anioNacimiento: d.nac.anioNacimiento,
    fechaNacimiento: d.nac.fechaNacimiento,
    // Categoría real por edad cumplida; puede diferir de la del Excel (spec 15).
    catAnio: d.catAnio,
    catFecha: d.catFecha,
    acudiente: texto(ws.getCell(`I${r}`)),
    celular: String(ws.getCell(`J${r}`).value ?? '').replace(/\D/g, ''),
    direccion: texto(ws.getCell(`K${r}`)),
    fechaInicio: d.fechaInicio,
    mesesPagados: mesesPagadosDeFila(ws, r, nombre, anomalias),
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
