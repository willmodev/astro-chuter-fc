import { Icon } from '../../chrome/Icon';
import { useMontosVisibles } from '../../hooks/useMontosVisibles';

// Interruptor de mostrar/ocultar montos (HU-7.2). Solo lo ve el admin: la
// app del entrenador no muestra ni un monto.
export function SwitchMontos() {
  const [visible, setVisible] = useMontosVisibles();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      onClick={() => {
        setVisible(!visible);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        padding: '13px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-md)',
          background: 'var(--info-soft)',
          color: 'var(--brand-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={visible ? 'eye' : 'eye-off'} size={19} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}
        >
          Mostrar montos
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {visible ? 'Las cifras están visibles' : 'Las cifras están ocultas'}
        </div>
      </div>
      <span
        aria-hidden="true"
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: visible ? 'var(--brand-navy)' : 'var(--border-subtle)',
          padding: 3,
          flexShrink: 0,
          transition: 'background 150ms ease',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: 999,
            background: '#fff',
            transform: visible ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 150ms ease',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
      </span>
    </button>
  );
}
