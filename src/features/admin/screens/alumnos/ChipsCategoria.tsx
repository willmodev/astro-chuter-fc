import { CATEGORIA_TODAS } from '@/lib/domain/alumnos';

import { CATEGORIES } from '../../data/mock';

// Chips de categoría combinables con el buscador. "Todas" restablece.
interface Props {
  value: string;
  onChange: (cat: string) => void;
}

const OPCIONES = [CATEGORIA_TODAS, ...CATEGORIES];

export function ChipsCategoria({ value, onChange }: Readonly<Props>) {
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', minWidth: 0 }}>
      <legend className="sr-only">Filtrar por categoría</legend>
      <div className="chips-row">
        {OPCIONES.map((cat) => {
          const activa = value === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
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
              {cat}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
