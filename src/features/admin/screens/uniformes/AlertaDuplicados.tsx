import { Icon } from '../../chrome/Icon';

// Alerta de números repetidos dentro del kit (R6). No aparece si no hay ninguno.
interface Props {
  numeros: number[];
}

export function AlertaDuplicados({ numeros }: Readonly<Props>) {
  if (numeros.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--warning-soft)',
        border: '1px solid color-mix(in srgb, var(--warning) 40%, white)',
      }}
    >
      <span style={{ color: '#946200', flexShrink: 0, marginTop: 1 }}>
        <Icon name="triangle-alert" size={18} />
      </span>
      <span style={{ fontSize: 12.5, color: '#946200', lineHeight: 1.35 }}>
        Números repetidos en este kit:{' '}
        <strong>{numeros.join(', ')}</strong>. Revisá las entregas para evitar
        duplicados.
      </span>
    </div>
  );
}
