import { LOCATION } from '@/lib/site';

import { Icon } from '../../chrome/Icon';

// Tarjeta de sede del entrenador: cancha + días/hora (formato corto del
// prototipo; la fuente humana larga vive en SCHEDULE de lib/site).
const HORARIO_CORTO = 'Lun · Mié · Vie · 4:30–6:00 PM';

export function VenueCard() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
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
        <Icon name="map-pin" size={19} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)' }}>
          {LOCATION.venue}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{HORARIO_CORTO}</div>
      </div>
    </div>
  );
}
