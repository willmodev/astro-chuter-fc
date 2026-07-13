import { Icon, type IconName } from '../../chrome/Icon';

// Fase fija de la sesión (Activación / Vuelta a la calma): informativa,
// no se digita — lo único que planea el profesor es la parte central.
interface Props {
  icono: IconName;
  fase: { titulo: string; pasos: readonly string[] };
}

export function FaseFijaCard({ icono, fase }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-sunken)',
          color: 'var(--brand-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icono} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-body)' }}>
          {fase.titulo}
          <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}> · fija</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
          {fase.pasos.join(' · ')}
        </div>
      </div>
    </div>
  );
}
