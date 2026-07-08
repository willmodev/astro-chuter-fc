import { Icon } from '../../chrome/Icon';

// Estado vacío del segmento "En mora" cuando nadie está en mora.
export function EstadoVacioCartera() {
  return (
    <output
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 200,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
        <span style={{ color: 'var(--success)' }}>
          <Icon name="circle-check" size={28} />
        </span>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>
          Nadie en mora
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Todos los alumnos están al día.
        </p>
      </div>
    </output>
  );
}
