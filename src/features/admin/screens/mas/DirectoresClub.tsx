import { COACHES } from '@/lib/site';

import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';

// Directores técnicos del club, desde COACHES. Cada uno enlaza a su Instagram.
export function DirectoresClub() {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {COACHES.map((c, i) => (
        <a
          key={c.instagram}
          href={c.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 13,
            padding: '13px 16px',
            color: 'inherit',
            textDecoration: 'none',
            borderTop: i ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <Avatar name={c.name} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-strong)',
              }}
            >
              {c.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {c.role}
            </div>
          </div>
          <span
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
            aria-label={`Instagram de ${c.name}`}
          >
            <Icon name="at-sign" size={18} />
          </span>
        </a>
      ))}
    </div>
  );
}
