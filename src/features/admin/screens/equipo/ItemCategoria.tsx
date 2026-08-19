import type { CSSProperties } from 'react';
import type { CategoriaAsignable } from './types';

// Una fila del selector de categorías. `bloqueada` = la tiene otro entrenador
// y esta pantalla no permite quitársela (alta, spec 15).
interface Props {
  categoria: CategoriaAsignable;
  activa: boolean;
  bloqueada: boolean;
  disabled: boolean;
  permitirTraspaso: boolean;
  onToggle: () => void;
}

const fila = (activa: boolean, apagada: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '9px 11px',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${activa ? 'var(--brand-navy)' : 'var(--border-subtle)'}`,
  background: apagada ? 'var(--surface-sunken)' : 'var(--surface-card)',
  color: apagada ? 'var(--text-muted)' : 'var(--text-strong)',
  fontSize: 14,
});

export function ItemCategoria({
  categoria,
  activa,
  bloqueada,
  disabled,
  permitirTraspaso,
  onToggle,
}: Readonly<Props>) {
  const inerte = bloqueada || disabled;

  return (
    <label
      style={{
        ...fila(activa, bloqueada),
        cursor: inerte ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={activa}
        disabled={inerte}
        onChange={onToggle}
        style={{ width: 17, height: 17, accentColor: 'var(--brand-navy)' }}
      />
      <span style={{ fontWeight: 600 }}>
        {categoria.etiqueta} · {categoria.nombre}
      </span>
      {categoria.ocupadaPor !== null && (
        <span style={{ marginLeft: 'auto', fontSize: 12 }}>
          {permitirTraspaso
            ? `hoy: ${categoria.ocupadaPor}`
            : categoria.ocupadaPor}
        </span>
      )}
    </label>
  );
}
