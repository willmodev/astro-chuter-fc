import type { MetodoPago } from '@/lib/domain/cartera';

import { Icon, type IconName } from '../../chrome/Icon';

interface Props {
  metodo: MetodoPago;
  onChange: (metodo: MetodoPago) => void;
}

const OPCIONES: { valor: MetodoPago; label: string; icon: IconName }[] = [
  { valor: 'efectivo', label: 'Efectivo', icon: 'banknote' },
  { valor: 'transferencia', label: 'Transferencia', icon: 'landmark' },
];

export function SelectorMetodo({ metodo, onChange }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p className="eyebrow">Método de pago</p>
      <div style={{ display: 'flex', gap: 10 }}>
        {OPCIONES.map((op) => {
          const activo = metodo === op.valor;
          return (
            <button
              key={op.valor}
              type="button"
              onClick={() => onChange(op.valor)}
              aria-pressed={activo}
              style={{
                flex: 1,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 'var(--radius-md)',
                border: activo ? '2px solid var(--brand-navy)' : '1px solid var(--border-subtle)',
                background: activo ? 'var(--brand-blue-soft)' : 'var(--surface-card)',
                color: activo ? 'var(--brand-navy)' : 'var(--text-body)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Icon name={op.icon} size={18} />
              {op.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
