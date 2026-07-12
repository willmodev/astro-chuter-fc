import { fmt } from '@/lib/format';

import { Icon } from '../../chrome/Icon';

// Precio del uniforme (R9), advertencia no bloqueante de número repetido (R6) y
// botón de confirmar. El precio ya considera el descuento de hermanos.
interface Props {
  precio: number;
  repetido: boolean;
  valido: boolean;
  esCorreccion: boolean;
  onConfirmar: () => void;
}

export function ResumenEntrega({
  precio,
  repetido,
  valido,
  esCorreccion,
  onConfirmar,
}: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          Precio del uniforme
        </span>
        <strong style={{ fontSize: 20, color: 'var(--text-strong)' }}>
          {fmt(precio)}
        </strong>
      </div>

      {repetido && (
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
            Ese número ya está usado en este kit. Podés guardar igual, pero
            revisá que no quede repetido.
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmar}
        disabled={!valido}
        style={{
          height: 48,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: valido ? 'var(--brand-navy)' : 'var(--neutral-300)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: valido ? 'pointer' : 'not-allowed',
        }}
      >
        {esCorreccion ? 'Guardar cambios' : 'Registrar entrega'}
      </button>
    </div>
  );
}
