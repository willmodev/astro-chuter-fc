import { fmt } from '@/lib/format';

// Total = Σ cuotas de los meses marcados; el botón queda deshabilitado
// sin meses seleccionados (spec 06, HU-3.5).
interface Props {
  total: number;
  deshabilitado: boolean;
  onConfirmar: () => void;
}

export function ResumenPago({ total, deshabilitado, onConfirmar }: Readonly<Props>) {
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
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total</span>
        <strong style={{ fontSize: 20, color: 'var(--text-strong)' }}>{fmt(total)}</strong>
      </div>
      <button
        type="button"
        onClick={onConfirmar}
        disabled={deshabilitado}
        style={{
          height: 48,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: deshabilitado ? 'var(--neutral-300)' : 'var(--brand-navy)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: deshabilitado ? 'not-allowed' : 'pointer',
        }}
      >
        Registrar pago
      </button>
    </div>
  );
}
