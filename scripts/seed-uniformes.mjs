// Parseo y carga de los dos kits (AZUL/ORO) desde la hoja CATEGORIAS del Excel.
// El estado del kit vive en el COLOR de relleno de la celda (spec 12):
//   verde (accent6, theme 9)  → entregado + pagado
//   rojo  (argb FFFF0000)     → entregado + sin pagar
//   azul  (accent1, theme 4)  → sin entregar + pagado
//   blanco (theme 0) / sin fill → sin iniciar (no crea fila)
// Abonos parciales NO están en el Excel (decisión pendiente #1): el seed siembra
// abono = precio (pagado) o 0 (sin pagar); los parciales se capturan en la app.
// <!-- TODO: pedir a Camilo - confirmar si el Excel lleva el monto abonado -->

// Columna de la hoja → nombre del kit.
export const KIT_COL = { U: 'AZUL', V: 'ORO' };

// Relleno de celda → color lógico del kit. Lista blanca; cualquier otro tono se
// reporta como desconocido (no se adivina), igual que el seed de pagos.
export function colorUniforme(cell) {
  const f = cell.fill;
  if (!f || f.type !== 'pattern' || f.pattern === 'none') return 'blanco';
  const fg = f.fgColor ?? {};
  if (fg.theme === 9) return 'verde';
  if (fg.theme === 4) return 'azul';
  if (fg.theme === 0) return 'blanco';
  if (typeof fg.argb === 'string' && fg.argb.toUpperCase() === 'FFFF0000') return 'rojo';
  return 'desconocido';
}

// Kits válidos de una fila. Empuja anomalías por color desconocido y omite blanco.
export function kitsDeFila(ws, r, nombre, anomalias) {
  const kits = [];
  for (const [col, kit] of Object.entries(KIT_COL)) {
    const color = colorUniforme(ws.getCell(`${col}${r}`));
    if (color === 'blanco') continue;
    if (color === 'desconocido') {
      anomalias.push(`F${r} ${nombre}: relleno de color desconocido en ${kit} → kit omitido`);
      continue;
    }
    // verde/rojo entregados; verde/azul pagados.
    kits.push({ kit, entregado: color !== 'azul', pagado: color !== 'rojo', color });
  }
  return kits;
}

// Inserta las filas de kits del alumno. Idempotente por (alumnoId, kit): no pisa
// datos capturados en la app. abono = precio si pagado, 0 si no.
export async function insertarUniformes(db, uniformes, alumnoId, kits, precio) {
  if (kits.length === 0) return 0;
  const ins = await db
    .insert(uniformes)
    .values(
      kits.map((k) => ({
        alumnoId,
        kit: k.kit,
        entregado: k.entregado,
        numero: null,
        talla: '',
        abonadoCop: k.pagado ? precio : 0,
        registradoPor: null,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: uniformes.id });
  return ins.length;
}

// Resumen de kits por color, por kit (para el reporte del seed).
export function resumenUniformes(filas) {
  const cnt = { AZUL: { verde: 0, rojo: 0, azul: 0 }, ORO: { verde: 0, rojo: 0, azul: 0 } };
  for (const f of filas) for (const k of f.kits) cnt[k.kit][k.color] += 1;
  const fmt = (kit) => `${kit}(verde=${cnt[kit].verde} rojo=${cnt[kit].rojo} azul=${cnt[kit].azul})`;
  return `${fmt('AZUL')} ${fmt('ORO')}`;
}
