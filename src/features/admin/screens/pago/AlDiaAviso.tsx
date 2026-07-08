import { Icon } from '../../chrome/Icon';

// Alumno sin ningún mes cobrable: no hay nada que cobrar.
export function AlDiaAviso() {
  return (
    <output
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 220,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
        <span style={{ color: 'var(--success)' }}>
          <Icon name="circle-check" size={30} />
        </span>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
          ¡Al día!
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          No hay meses por cobrar.
        </p>
      </div>
    </output>
  );
}
