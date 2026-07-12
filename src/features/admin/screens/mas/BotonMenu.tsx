import { Icon, type IconName } from '../../chrome/Icon';

// Ítem de navegación del menú Más (Equipo, Uniformes…): icono + label + pista.
interface Props {
  icon: IconName;
  label: string;
  hint: string;
  onClick: () => void;
}

export function BotonMenu({ icon, label, hint, onClick }: Readonly<Props>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 56,
        padding: '0 18px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--text-strong)',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Icon name={icon} size={20} color="var(--brand-navy)" />
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
        {hint}
      </span>
    </button>
  );
}
