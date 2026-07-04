import type { CSSProperties } from 'react';

import { SectionLabel } from '../../chrome/SectionLabel';
import type { TabId } from '../../chrome/tabs';
import type { DashboardData } from '../../hooks/useDashboardData';
import { CobrosPendientes } from './CobrosPendientes';
import { EntrenoDeHoy } from './EntrenoDeHoy';
import { HeroRecaudo } from './HeroRecaudo';
import { KpisGrid } from './KpisGrid';
import { ProximosCumples } from './ProximosCumples';
import { RecaudoPorMes } from './RecaudoPorMes';

// Pantalla Dashboard: compone las 6 secciones a partir del contrato estable
// `DashboardData`. Sin lógica de negocio aquí (vive en dominio + hook).
interface Props {
  data: DashboardData;
  onNav: (tab: TabId) => void;
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

export function Dashboard({ data, onNav }: Readonly<Props>) {
  return (
    <div>
      <HeroRecaudo stats={data.stats} mesLong={data.mesesLong[data.mesVivo]} />
      <KpisGrid stats={data.stats} />
      <RecaudoPorMes monthly={data.monthly} />

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
      <ProximosCumples cumple={data.cumple} />

      <SectionLabel
        action={
          <button onClick={() => onNav('mas')} style={ghostLink}>
            Planificar
          </button>
        }
      >
        Entrenamiento de hoy
      </SectionLabel>
      <EntrenoDeHoy entreno={data.entrenoHoy} />
    </div>
  );
}
