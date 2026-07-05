import { Icon } from '../../chrome/Icon';

// Estado para un :id numérico que no existe en la fuente de datos.
interface Props {
  onVolver: () => void;
}

export function AlumnoNoEncontrado({ onVolver }: Readonly<Props>) {
  return (
    <div
      role="status"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 280,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          <Icon name="triangle-alert" size={30} />
        </span>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
          Alumno no encontrado
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          El alumno que buscas no existe o fue retirado.
        </p>
        <button
          type="button"
          onClick={onVolver}
          style={{
            marginTop: 8,
            height: 44,
            padding: '0 22px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Volver a la lista
        </button>
      </div>
    </div>
  );
}
