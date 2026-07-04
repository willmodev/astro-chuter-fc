import { fmtShort } from '@/lib/format';

import { Badge } from '../../ui/Badge';
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
        background: 'linear-gradient(160deg, var(--brand-navy), var(--brand-navy-deep))',
        margin: '14px 16px 4px',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px 20px',
        color: '#fff',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="eyebrow" style={{ color: 'var(--brand-gold)' }}>
          Recaudo de {mesLong.toLowerCase()} · en curso
        </span>
        <Badge tone="gold">Meta {fmtShort(stats.metaMes)}</Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span className="font-display tabular" style={{ fontSize: 46, lineHeight: 0.9 }}>
          {fmtShort(stats.recaudoMes)}
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
              width: `${stats.pctMeta}%`,
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
            <b style={{ color: '#fff', fontWeight: 800 }}>{stats.pctMeta}%</b> de la meta
          </span>
          <span>
            Cartera vencida{' '}
            <b style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>
              {fmtShort(stats.carteraVencida)}
            </b>
          </span>
        </div>
      </div>
    </div>
  );
}
