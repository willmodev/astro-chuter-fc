import { fmtShort } from '@/lib/format';

import { Icon } from '../../chrome/Icon';
import { KpiCard } from '../../ui/KpiCard';
import type { Stats } from '../../data/types';

// KPIs: 2 columnas en mobile → 4 en desktop (clase `.admin-kpis` en admin.css).
interface Props {
  stats: Stats;
}

export function KpisGrid({ stats }: Readonly<Props>) {
  return (
    <div className="admin-kpis" style={{ padding: '10px 16px 4px' }}>
      <KpiCard
        label="Alumnos activos"
        value={stats.active}
        delta="+8 este mes"
        deltaTone="paid"
        accent="navy"
        icon={<Icon name="users" size={16} />}
      />
      <KpiCard
        label="Al día"
        value={stats.pctUpToDate}
        unit="%"
        delta={`${stats.upToDate} de ${stats.active}`}
        deltaTone="neutral"
        accent="success"
        icon={<Icon name="circle-check" size={16} />}
      />
      <KpiCard
        label="En mora"
        value={stats.morosos}
        unit="alum."
        delta="Requieren cobro"
        deltaTone="due"
        accent="error"
        icon={<Icon name="triangle-alert" size={16} />}
      />
      <KpiCard
        label="Recaudo año"
        value={fmtShort(stats.recaudo)}
        delta="Temporada 2026"
        deltaTone="neutral"
        accent="gold"
        icon={<Icon name="wallet" size={16} />}
      />
    </div>
  );
}
