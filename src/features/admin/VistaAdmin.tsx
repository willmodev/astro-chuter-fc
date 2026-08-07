import { EstadoCarga } from './chrome/EstadoCarga';
import { Alumnos } from './screens/alumnos/Alumnos';
import { Cartera } from './screens/cartera/Cartera';
import { Dashboard } from './screens/dashboard/Dashboard';
import { MasMenu } from './screens/mas/MasMenu';
import { VistaDetalle } from './VistaDetalle';

import type { TabId } from './chrome/tabs';
import type { DashboardData } from './hooks/useDashboardData';
import type { RutaAdmin } from './router/types';

// Despacha las cuatro vistas de la tab bar; el resto lo resuelve
// VistaDetalle. Vive aparte de AdminApp para no cargar el shell.
interface Props {
  ruta: RutaAdmin;
  role: 'admin' | 'entrenador';
  userName: string;
  dashboard: DashboardData;
  navegar: (ruta: RutaAdmin) => void;
  volver: () => void;
  navegarTab: (tab: TabId) => void;
}

export function VistaAdmin({
  ruta,
  role,
  userName,
  dashboard,
  navegar,
  volver,
  navegarTab,
}: Readonly<Props>) {
  switch (ruta.vista) {
    case 'dashboard':
      return dashboard.data ? (
        <Dashboard
          data={dashboard.data}
          onNav={navegarTab}
          onOpenEntrenamientos={() => {
            navegar({ vista: 'entrenamientos' });
          }}
        />
      ) : (
        <EstadoCarga
          estado={dashboard.estado === 'error' ? 'error' : 'cargando'}
          onReintentar={() => void dashboard.recargar()}
        />
      );

    case 'alumnos':
      return (
        <Alumnos
          onOpenFicha={(alumnoId) => {
            navegar({ vista: 'ficha', alumnoId });
          }}
        />
      );

    case 'cartera':
      return (
        <Cartera
          onCobrarMes={(alumnoId, mes) => {
            navegar({ vista: 'pago', alumnoId, mes });
          }}
        />
      );

    case 'mas':
      return (
        <MasMenu
          userName={userName}
          role={role}
          onOpenEquipo={() => {
            navegar({ vista: 'equipo' });
          }}
          onOpenUniformes={() => {
            navegar({ vista: 'uniformes' });
          }}
          onOpenEntrenamientos={() => {
            navegar({ vista: 'entrenamientos' });
          }}
        />
      );

    default:
      return <VistaDetalle ruta={ruta} navegar={navegar} volver={volver} />;
  }
}
