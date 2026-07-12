// Estado de pago del uniforme: pagado / pendiente. Toggle de dos opciones.
type EstadoPago = 'pagado' | 'pendiente';

interface Props {
  pago: EstadoPago;
  onChange: (pago: EstadoPago) => void;
}

const OPCIONES: { valor: EstadoPago; label: string }[] = [
  { valor: 'pagado', label: 'Pagado' },
  { valor: 'pendiente', label: 'Pendiente' },
];

export function PagoToggle({ pago, onChange }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span className="eyebrow">Estado de pago</span>
      <div style={{ display: 'flex', gap: 10 }}>
        {OPCIONES.map((op) => {
          const activo = pago === op.valor;
          return (
            <button
              key={op.valor}
              type="button"
              onClick={() => onChange(op.valor)}
              aria-pressed={activo}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 'var(--radius-md)',
                border: activo
                  ? '2px solid var(--brand-navy)'
                  : '1px solid var(--border-subtle)',
                background: activo ? 'var(--brand-blue-soft)' : 'var(--surface-card)',
                color: activo ? 'var(--brand-navy)' : 'var(--text-body)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {op.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
