import type { CategoriaAsignable } from './types';

// Selección múltiple de categorías del catálogo (spec 15): sin texto libre.
// Las que ya tiene otro entrenador activo van deshabilitadas y dicen quién.
interface Props {
  categorias: readonly CategoriaAsignable[];
  cargando: boolean;
  seleccionadas: readonly string[];
  onToggle: (etiqueta: string) => void;
  disabled?: boolean;
}

export function SelectorCategorias({
  categorias,
  cargando,
  seleccionadas,
  onToggle,
  disabled = false,
}: Readonly<Props>) {
  if (cargando) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        Cargando categorías…
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {categorias.map((c) => {
        const ocupada = c.ocupadaPor !== null;
        const activa = seleccionadas.includes(c.etiqueta);
        return (
          <label
            key={c.etiqueta}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 11px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${activa ? 'var(--brand-navy)' : 'var(--border-subtle)'}`,
              background: ocupada
                ? 'var(--surface-sunken)'
                : 'var(--surface-card)',
              color: ocupada ? 'var(--text-muted)' : 'var(--text-strong)',
              cursor: ocupada || disabled ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={activa}
              disabled={ocupada || disabled}
              onChange={() => {
                onToggle(c.etiqueta);
              }}
              style={{
                width: 17,
                height: 17,
                accentColor: 'var(--brand-navy)',
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {c.etiqueta} · {c.nombre}
            </span>
            {ocupada && (
              <span style={{ marginLeft: 'auto', fontSize: 12 }}>
                {c.ocupadaPor}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
