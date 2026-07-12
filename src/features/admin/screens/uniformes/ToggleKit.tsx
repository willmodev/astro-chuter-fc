import type { TipoKit } from '@/lib/domain/uniformes';

// Toggle de kit AZUL / DORADO. Filtra el listado de la pantalla Uniformes.
interface Props {
  kit: TipoKit;
  onChange: (kit: TipoKit) => void;
}

const OPCIONES: { valor: TipoKit; label: string; color: string }[] = [
  { valor: 'AZUL', label: 'Azul', color: 'var(--brand-blue)' },
  { valor: 'DORADO', label: 'Dorado', color: 'var(--brand-gold-deep)' },
];

export function ToggleKit({ kit, onChange }: Readonly<Props>) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {OPCIONES.map((op) => {
        const activo = kit === op.valor;
        return (
          <button
            key={op.valor}
            type="button"
            onClick={() => onChange(op.valor)}
            aria-pressed={activo}
            style={{
              flex: 1,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 'var(--radius-md)',
              border: activo
                ? `2px solid ${op.color}`
                : '1px solid var(--border-subtle)',
              background: activo ? 'var(--surface-sunken)' : 'var(--surface-card)',
              color: activo ? 'var(--text-strong)' : 'var(--text-muted)',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: op.color,
              }}
            />
            Kit {op.label}
          </button>
        );
      })}
    </div>
  );
}
