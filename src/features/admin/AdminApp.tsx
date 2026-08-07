import { useEffect, useState } from 'react';

import { AccionRapidaMenu } from './chrome/AccionRapidaMenu';
import { AdminShell } from './chrome/AdminShell';
import { IconButton } from './chrome/IconButton';
import { TABS_ADMIN, type TabId } from './chrome/tabs';
import { EntrenadorApp } from './EntrenadorApp';
import { useDashboardData } from './hooks/useDashboardData';
import { useAdminRouter } from './router/useAdminRouter';
import { META, RUTA_DE_TAB, TAB_DE_VISTA } from './router/vistaMeta';
import { VistaAdmin } from './VistaAdmin';

export interface AdminAppProps {
  role: 'admin' | 'entrenador';
  userId: string;
  userName: string;
  cats: string[];
}

// La vista activa la decide la URL (useAdminRouter). Las vistas del entrenador
// (entrenos/sesion/plantel) nunca llegan acá: el gate del router las convierte
// en 'entrenamientos'. La metadata de vistas vive en `router/vistaMeta`.
export function AdminApp({
  role,
  userId,
  userName,
  cats,
}: Readonly<AdminAppProps>) {
  // Gate por rol: cada rol monta su app; el router refuerza vista a vista.
  if (role === 'entrenador') {
    return <EntrenadorApp userId={userId} userName={userName} cats={cats} />;
  }
  return (
    <AdminHome role={role} userId={userId} userName={userName} cats={cats} />
  );
}

function AdminHome({ role, userName }: Readonly<AdminAppProps>) {
  const { ruta, navegar, volver } = useAdminRouter('admin');
  const [actionOpen, setActionOpen] = useState(false);
  const dashboard = useDashboardData();
  const { data, recargar } = dashboard;
  const meta = META[ruta.vista];
  const navegarTab = (tab: TabId) => {
    navegar(RUTA_DE_TAB[tab]);
  };

  // DT-2: AdminHome no se desmonta, así que la carga inicial corre una sola
  // vez. Revalidar al volver a Inicio refleja retiros, pagos y altas.
  useEffect(() => {
    if (ruta.vista === 'dashboard') void recargar();
  }, [ruta.vista, recargar]);

  const right =
    ruta.vista === 'dashboard' && data ? (
      <IconButton
        icon="bell"
        label="Notificaciones"
        badge={data.stats.morosos}
      />
    ) : undefined;

  return (
    <>
      <AdminShell
        tabs={TABS_ADMIN}
        active={TAB_DE_VISTA[ruta.vista]}
        onTab={navegarTab}
        onAction={() => {
          setActionOpen(true);
        }}
        title={meta.title}
        eyebrow={meta.eyebrow}
        right={right}
      >
        <VistaAdmin
          ruta={ruta}
          role={role}
          userName={userName}
          dashboard={dashboard}
          navegar={navegar}
          volver={volver}
          navegarTab={navegarTab}
        />
      </AdminShell>

      {actionOpen && (
        <AccionRapidaMenu
          onInscribir={() => {
            setActionOpen(false);
            navegar({ vista: 'alumnoNuevo' });
          }}
          onRegistrarPago={() => {
            setActionOpen(false);
            navegar({ vista: 'cartera' });
          }}
          onClose={() => {
            setActionOpen(false);
          }}
        />
      )}
    </>
  );
}
