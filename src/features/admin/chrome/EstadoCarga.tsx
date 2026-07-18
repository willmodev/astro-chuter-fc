import { Icon } from './Icon';

// Estado de carga/error uniforme para las pantallas conectadas a Actions.
// Fuente única del skeleton y del error con reintento (spec 11).
export type EstadoCargaValor = 'cargando' | 'listo' | 'error';

interface Props {
  estado: 'cargando' | 'error';
  onReintentar?: () => void;
}

export function EstadoCarga({ estado, onReintentar }: Readonly<Props>) {
  if (estado === 'error') {
    return (
      <div style={{ display: 'grid', gap: 12, placeItems: 'center', padding: '48px 24px', textAlign: 'center' }}>
        <span style={{ color: 'var(--error)' }}>
          <Icon name="triangle-alert" size={34} />
        </span>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
          No pudimos cargar los datos.
        </p>
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            style={{
              height: 40,
              padding: '0 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--brand-navy)',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ display: 'grid', gap: 10, padding: '16px', opacity: 0.55 }}
    >
      <span className="sr-only">Cargando…</span>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-subtle)',
          }}
        />
      ))}
    </div>
  );
}
