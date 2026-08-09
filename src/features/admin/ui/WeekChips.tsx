import { useEffect, useRef } from 'react';

import type { Semana } from '@/lib/domain/entrenos';

// Selector de semana (historial de entrenos): chips scrolleables en orden de
// calendario. Cada chip se explica solo — etiqueta ("Esta semana", "Pasada",
// "Próxima") sobre la fecha — y la semana viva queda marcada aunque no esté
// seleccionada. Compartido por la home del entrenador y Entrenamientos (spec 09).
interface Props {
  semanas: readonly Semana[];
  value: string;
  onChange: (weekId: string) => void;
}

/** Colores del chip según si está seleccionado y si es la semana viva. */
function estiloChip(activa: boolean, current: boolean) {
  if (activa)
    return {
      background: 'var(--brand-navy)',
      color: '#fff',
      border: 'none' as const,
    };
  return {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    border: current
      ? '2px solid var(--brand-navy)'
      : '1px solid var(--border-subtle)',
  };
}

export function WeekChips({ semanas, value, onChange }: Readonly<Props>) {
  const filaRef = useRef<HTMLDivElement>(null);
  const activaRef = useRef<HTMLButtonElement>(null);

  // La fila arranca scrolleada a la semana seleccionada: en móvil los 5 chips
  // no caben y el orden de calendario dejaría la actual fuera de pantalla.
  useEffect(() => {
    const fila = filaRef.current;
    const chip = activaRef.current;
    if (!fila || !chip) return;
    fila.scrollLeft =
      chip.offsetLeft - (fila.clientWidth - chip.offsetWidth) / 2;
  }, [value]);

  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', minWidth: 0 }}>
      <legend className="sr-only">Elegir semana</legend>
      <div className="chips-row" ref={filaRef}>
        {semanas.map((w) => {
          const activa = value === w.id;
          return (
            <button
              key={w.id}
              ref={activa ? activaRef : null}
              type="button"
              onClick={() => {
                onChange(w.id);
              }}
              aria-pressed={activa}
              aria-label={`${w.sub}, ${w.label}`}
              style={{
                flexShrink: 0,
                display: 'grid',
                gap: 1,
                justifyItems: 'center',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: 1.25,
                ...estiloChip(activa, w.current),
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  opacity: activa ? 0.75 : 0.6,
                }}
              >
                {w.chip}
              </span>
              <span
                aria-hidden="true"
                style={{ fontSize: 13, fontWeight: activa ? 700 : 600 }}
              >
                {w.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
