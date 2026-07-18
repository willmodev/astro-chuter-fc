// Reglas puras de cumpleaños — capa de dominio, sin UI ni datos (spec 11).
// El dashboard muestra los próximos cumpleaños; solo alumnos con fecha completa
// (los migrados del Excel traen solo el año → `fechaNacimiento` null → se ignoran).

const MES_ABREV = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

const MS_DIA = 24 * 60 * 60 * 1000;

export interface AlumnoConFecha {
  name: string;
  cat: string;
  fechaNacimiento: Date | null;
}

export interface Cumple {
  name: string;
  cat: string;
  fecha: string; // "12 jun"
  dias: number; // días desde hoy hasta el próximo cumpleaños (0 = hoy)
}

// Medianoche local (descarta la hora para contar días enteros sin sesgo de TZ).
function aMedianoche(f: Date): Date {
  return new Date(f.getFullYear(), f.getMonth(), f.getDate());
}

// Próximo cumpleaños ≥ hoy: este año si aún no pasó, el siguiente si ya pasó.
function proximoCumple(nacimiento: Date, hoy: Date): Date {
  const mes = nacimiento.getMonth();
  const dia = nacimiento.getDate();
  const esteAnio = new Date(hoy.getFullYear(), mes, dia);
  return esteAnio >= hoy ? esteAnio : new Date(hoy.getFullYear() + 1, mes, dia);
}

/**
 * Próximos cumpleaños ordenados por proximidad (incluye el cruce de año).
 * Ignora alumnos sin fecha completa (`fechaNacimiento === null`).
 */
export function proximosCumples(
  alumnos: readonly AlumnoConFecha[],
  hoy: Date,
): Cumple[] {
  const base = aMedianoche(hoy);
  return alumnos
    .filter(
      (a): a is AlumnoConFecha & { fechaNacimiento: Date } =>
        a.fechaNacimiento !== null,
    )
    .map((a) => {
      const prox = proximoCumple(a.fechaNacimiento, base);
      const dias = Math.round((prox.getTime() - base.getTime()) / MS_DIA);
      return {
        name: a.name,
        cat: a.cat,
        fecha: `${prox.getDate()} ${MES_ABREV[prox.getMonth()]}`,
        dias,
      };
    })
    .sort((x, y) => x.dias - y.dias);
}
