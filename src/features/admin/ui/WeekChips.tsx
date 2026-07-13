import type { Semana } from '@/lib/domain/entrenos';

// Selector de semana (historial de entrenos): chips scrolleables, la semana
// actual se distingue con el prefijo "Sem ·". Compartido por la home del
// entrenador y la vista Entrenamientos del admin (spec 09).
interface Props {
  semanas: readonly Semana[];
  value: string;
  onChange: (weekId: string) => void;
}

export function WeekChips({ semanas, value, onChange }: Readonly<Props>) {
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', minWidth: 0 }}>
      <legend className="sr-only">Elegir semana</legend>
      <div className="chips-row">
        {semanas.map((w) => {
          const activa = value === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange(w.id)}
              aria-pressed={activa}
              style={{
                flexShrink: 0,
                height: 34,
                padding: '0 14px',
                borderRadius: 'var(--radius-pill)',
                border: activa ? 'none' : '1px solid var(--border-subtle)',
                background: activa ? 'var(--brand-navy)' : 'var(--surface-card)',
                color: activa ? '#fff' : 'var(--text-body)',
                fontSize: 13,
                fontWeight: activa ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {w.current ? `Sem · ${w.label}` : w.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
