import { Badge } from '../../ui/Badge';
import { Monto } from '../../ui/Monto';

import type { Stats } from '../../data/types';

// Hero navy: recaudo del mes en curso, barra de progreso a la meta y
// cartera vencida. Numeral grande en Bebas.
interface Props {
  stats: Stats;
  mesLong: string;
}

export function HeroRecaudo({ stats, mesLong }: Readonly<Props>) {
  return (
    <div
      className="bg-pitch-lines"
      style={{
        background:
          'linear-gradient(160deg, var(--brand-navy), var(--brand-navy-deep))',
        margin: '14px 16px 4px',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px 20px',
        color: '#fff',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <span className="eyebrow" style={{ color: 'var(--brand-gold)' }}>
          Recaudo de {mesLong.toLowerCase()} · en curso
        </span>
        <Badge tone="gold">
          Meta <Monto valor={stats.metaMes} corto />
        </Badge>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginTop: 6,
        }}
      >
        <span
          className="font-display tabular"
          style={{ fontSize: 46, lineHeight: 0.9 }}
        >
          <Monto valor={stats.recaudoMes} corto />
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.16)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${String(stats.pctMeta)}%`,
              height: '100%',
              background: 'var(--brand-gold)',
              borderRadius: 999,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 7,
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <span>
            <b style={{ color: '#fff', fontWeight: 800 }}>{stats.pctMeta}%</b>{' '}
            de la meta
          </span>
          <span>
            Cartera vencida{' '}
            <b style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>
              <Monto valor={stats.carteraVencida} corto />
            </b>
          </span>
        </div>
      </div>
    </div>
  );
}
