import type { CSSProperties } from 'react';

import type { DashboardStats } from '@/lib/services/dashboard';

import { SectionLabel } from '../../chrome/SectionLabel';
import type { TabId } from '../../chrome/tabs';
import { CobrosPendientes } from './CobrosPendientes';
import { EntrenoDeHoyCard } from './EntrenoDeHoyCard';
import { HeroRecaudo } from './HeroRecaudo';
import { KpisGrid } from './KpisGrid';
import { ProximosCumples } from './ProximosCumples';
import { RecaudoPorMes } from './RecaudoPorMes';

// Pantalla Dashboard: compone las secciones a partir de `dashboard.stats`. La
// card EntrenoDeHoy solo aparece en días Lun/Mié/Vie (spec 13); los cumpleaños
// son reales. Sin lógica de negocio aquí (vive en dominio/servicio).
interface Props {
  data: DashboardStats;
  onNav: (tab: TabId) => void;
  onOpenEntrenamientos: () => void;
}

const ghostLink: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--brand-navy)',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
};

export function Dashboard({ data, onNav, onOpenEntrenamientos }: Readonly<Props>) {
  return (
    <div>
      <HeroRecaudo stats={data.stats} mesLong={data.mesesLong[data.mesVivo]} />
      <KpisGrid stats={data.stats} />
      <RecaudoPorMes monthly={data.monthly} />

      {data.entrenoDeHoy !== null && data.entrenoDeHoy.filas.length > 0 && (
        <EntrenoDeHoyCard entreno={data.entrenoDeHoy} onOpen={onOpenEntrenamientos} />
      )}

      <SectionLabel
        action={
          <button onClick={() => onNav('cartera')} style={ghostLink}>
            Ver cartera
          </button>
        }
      >
        Cobros pendientes
      </SectionLabel>
      <CobrosPendientes morosos={data.morosos} onOpen={() => onNav('alumnos')} />

      <SectionLabel>Próximos cumpleaños</SectionLabel>
      <ProximosCumples cumple={data.cumples} />
    </div>
  );
}
