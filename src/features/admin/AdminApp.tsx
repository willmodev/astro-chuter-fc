import { useState } from 'react';

import { AdminShell } from './chrome/AdminShell';
import { IconButton } from './chrome/IconButton';
import { ProximamenteDialog } from './chrome/ProximamenteDialog';
import { type TabId } from './chrome/tabs';
import { useDashboardData } from './hooks/useDashboardData';
import { useAdminRouter } from './router/useAdminRouter';
import { Dashboard } from './screens/dashboard/Dashboard';
import { EntrenadorHome } from './screens/entrenador/EntrenadorHome';
import { EquipoScreen } from './screens/equipo/EquipoScreen';
import { Alumnos } from './screens/alumnos/Alumnos';
import { Cartera } from './screens/cartera/Cartera';
import { Ficha } from './screens/ficha/Ficha';
import { MasMenu } from './screens/mas/MasMenu';
import { Pago } from './screens/pago/Pago';
import type { RutaAdmin } from './router/types';

export interface AdminAppProps {
  role: 'admin' | 'entrenador';
  userName: string;
}

// La vista activa la decide la URL (useAdminRouter). Todas las vistas
// renderizan contenido real; Uniformes/Entrenamientos/Más real siguen
// "Próximamente" dentro de sus propias pantallas (otros specs).
const META: Record<RutaAdmin['vista'], { title: string; eyebrow: string }> = {
  dashboard: { title: 'Dashboard', eyebrow: 'Temporada 2026' },
  alumnos: { title: 'Alumnos', eyebrow: 'Inscripciones' },
  ficha: { title: 'Alumnos', eyebrow: 'Ficha del alumno' },
  cartera: { title: 'Cartera', eyebrow: 'Control de cobros' },
  pago: { title: 'Cartera', eyebrow: 'Registrar pago' },
  mas: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
  equipo: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
};

// Tab resaltada en la navegación para cada vista (Ficha cuelga de Alumnos,
// Equipo cuelga de Más, Pago cuelga de Cartera).
const TAB_DE_VISTA: Record<RutaAdmin['vista'], TabId> = {
  dashboard: 'dashboard',
  alumnos: 'alumnos',
  ficha: 'alumnos',
  cartera: 'cartera',
  pago: 'cartera',
  mas: 'mas',
  equipo: 'mas',
};

const RUTA_DE_TAB: Record<TabId, RutaAdmin> = {
  dashboard: { vista: 'dashboard' },
  alumnos: { vista: 'alumnos' },
  cartera: { vista: 'cartera' },
  mas: { vista: 'mas' },
};

export function AdminApp({ role, userName }: Readonly<AdminAppProps>) {
  // Gate por rol: el entrenador aún no tiene app propia (otro spec).
  if (role === 'entrenador') {
    return <EntrenadorHome userName={userName} />;
  }
  return <AdminHome role={role} userName={userName} />;
}

function AdminHome({ role, userName }: Readonly<AdminAppProps>) {
  const { ruta, navegar } = useAdminRouter();
  const [actionOpen, setActionOpen] = useState(false);
  const data = useDashboardData();
  const meta = META[ruta.vista];
  const navegarTab = (tab: TabId) => navegar(RUTA_DE_TAB[tab]);

  const right =
    ruta.vista === 'dashboard' ? (
      <IconButton icon="bell" label="Notificaciones" badge={data.stats.morosos} />
    ) : undefined;

  return (
    <>
      <AdminShell
        active={TAB_DE_VISTA[ruta.vista]}
        onTab={navegarTab}
        onAction={() => setActionOpen(true)}
        title={meta.title}
        eyebrow={meta.eyebrow}
        right={right}
      >
        {ruta.vista === 'dashboard' && <Dashboard data={data} onNav={navegarTab} />}
        {ruta.vista === 'alumnos' && (
          <Alumnos
            onOpenFicha={(alumnoId) => navegar({ vista: 'ficha', alumnoId })}
          />
        )}
        {ruta.vista === 'mas' && (
          <MasMenu
            userName={userName}
            role={role}
            onOpenEquipo={() => navegar({ vista: 'equipo' })}
          />
        )}
        {ruta.vista === 'equipo' && (
          <EquipoScreen onBack={() => navegar({ vista: 'mas' })} />
        )}
        {ruta.vista === 'ficha' && (
          <Ficha
            alumnoId={ruta.alumnoId}
            onVolver={() => navegar({ vista: 'alumnos' })}
            onRegistrarPago={(mes) =>
              navegar({ vista: 'pago', alumnoId: ruta.alumnoId, mes })
            }
          />
        )}
        {ruta.vista === 'cartera' && (
          <Cartera
            onCobrarMes={(alumnoId, mes) => navegar({ vista: 'pago', alumnoId, mes })}
          />
        )}
        {ruta.vista === 'pago' && (
          <Pago
            alumnoId={ruta.alumnoId}
            mes={ruta.mes}
            onVolver={() => navegar({ vista: 'ficha', alumnoId: ruta.alumnoId })}
          />
        )}
      </AdminShell>

      {actionOpen && (
        <ProximamenteDialog
          eyebrow="Acción rápida"
          mensaje="Registrar pago e inscribir alumno llegan en otro spec."
          onClose={() => setActionOpen(false)}
        />
      )}
    </>
  );
}

