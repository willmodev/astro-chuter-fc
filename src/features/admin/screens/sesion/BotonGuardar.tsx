import { Icon } from '../../chrome/Icon';

// CTA de guardado (planeación / asistencia). Mismo botón dorado para los dos
// registros de la sesión; el texto lo pone cada bloque.
interface Props {
  label: string;
  onClick: () => void;
}

export function BotonGuardar({ label, onClick }: Readonly<Props>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 48,
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'var(--brand-gold)',
        color: 'var(--text-on-gold)',
        fontSize: 15,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Icon name="check" size={17} strokeWidth={2.4} />
      {label}
    </button>
  );
}
