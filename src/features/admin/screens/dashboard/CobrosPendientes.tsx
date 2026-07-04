import { mesesEnMora, saldoPendiente } from '@/lib/domain/cartera';
import { fmt } from '@/lib/format';
import { waTo } from '@/lib/whatsapp';

import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';
import type { Alumno } from '../../data/types';

// Top morosos con avatar (aro dorado), saldo y botón de recordatorio por
// WhatsApp al acudiente.
interface Props {
  morosos: Alumno[];
  onOpen: (a: Alumno) => void;
}

export function CobrosPendientes({ morosos, onOpen }: Readonly<Props>) {
  return (
    <div
      style={{
        margin: '0 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {morosos.map((s, i) => {
        const meses = mesesEnMora(s);
        return (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 14px',
              borderTop: i ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <button
              onClick={() => onOpen(s)}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <Avatar name={s.name} size={38} ring />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--text-strong)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    color: 'var(--error-deep)',
                    fontWeight: 600,
                  }}
                >
                  {meses} {meses === 1 ? 'mes' : 'meses'} · {fmt(saldoPendiente(s))}
                </span>
              </span>
            </button>
            <a
              href={waTo(s.phone, `Hola ${s.acu}, te recordamos la mensualidad de ${s.name} en Chuter FC.`)}
              target="_blank"
              rel="noreferrer"
              aria-label="Recordar por WhatsApp"
              style={{
                flexShrink: 0,
                width: 38,
                height: 38,
                borderRadius: '50%',
                textDecoration: 'none',
                background: 'color-mix(in srgb, var(--whatsapp) 14%, white)',
                color: 'var(--whatsapp)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="message-circle" size={19} />
            </a>
          </div>
        );
      })}
    </div>
  );
}
