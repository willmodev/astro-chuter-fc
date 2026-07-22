import { useState } from 'react';

import { AccionRapidaMenu } from './chrome/AccionRapidaMenu';
import { AdminShell } from './chrome/AdminShell';
import { EstadoCarga } from './chrome/EstadoCarga';
import { IconButton } from './chrome/IconButton';
import { TABS_ADMIN, type TabId } from './chrome/tabs';
import { EntrenadorApp } from './EntrenadorApp';
import { useDashboardData } from './hooks/useDashboardData';
import { useAdminRouter } from './router/useAdminRouter';
import { META, RUTA_DE_TAB, TAB_DE_VISTA } from './router/vistaMeta';
import { AlumnoForm } from './screens/alumno-form/AlumnoForm';
import { Dashboard } from './screens/dashboard/Dashboard';
import { Entrenamientos } from './screens/entrenamientos/Entrenamientos';
import { EquipoScreen } from './screens/equipo/EquipoScreen';
import { Alumnos } from './screens/alumnos/Alumnos';
import { Cartera } from './screens/cartera/Cartera';
import { Ficha } from './screens/ficha/Ficha';
import { MasMenu } from './screens/mas/MasMenu';
import { Pago } from './screens/pago/Pago';
import { UniformeEntrega } from './screens/uniforme-entrega/UniformeEntrega';
import { Uniformes } from './screens/uniformes/Uniformes';
import type { RutaAdmin } from './router/types';

export interface AdminAppProps {
  role: 'admin' | 'entrenador';
  userId: string;
  userName: string;
  cats: string[];
}

// La vista activa la decide la URL (useAdminRouter). Las vistas del entrenador
// (entrenos/sesion/plantel) nunca llegan acá: el gate del router las convierte
// en 'entrenamientos'. La metadata de vistas vive en `router/vistaMeta`.
export function AdminApp({ role, userId, userName, cats }: Readonly<AdminAppProps>) {
  // Gate por rol: cada rol monta su app; el router refuerza vista a vista.
  if (role === 'entrenador') {
    return <EntrenadorApp userId={userId} userName={userName} cats={cats} />;
  }
  return <AdminHome role={role} userId={userId} userName={userName} cats={cats} />;
}

function AdminHome({ role, userName }: Readonly<AdminAppProps>) {
  const { ruta, navegar, volver } = useAdminRouter('admin');
  const [actionOpen, setActionOpen] = useState(false);
  const { data, estado, recargar } = useDashboardData();
  const meta = META[ruta.vista];
  const navegarTab = (tab: TabId) => navegar(RUTA_DE_TAB[tab]);

  const right =
    ruta.vista === 'dashboard' && data ? (
      <IconButton icon="bell" label="Notificaciones" badge={data.stats.morosos} />
    ) : undefined;

  return (
    <>
      <AdminShell
        tabs={TABS_ADMIN}
        active={TAB_DE_VISTA[ruta.vista]}
        onTab={navegarTab}
        onAction={() => setActionOpen(true)}
        title={meta.title}
        eyebrow={meta.eyebrow}
        right={right}
      >
        {ruta.vista === 'dashboard' &&
          (data ? (
            <Dashboard
              data={data}
              onNav={navegarTab}
              onOpenEntrenamientos={() => navegar({ vista: 'entrenamientos' })}
            />
          ) : (
            <EstadoCarga
              estado={estado === 'error' ? 'error' : 'cargando'}
              onReintentar={recargar}
            />
          ))}
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
            onOpenUniformes={() => navegar({ vista: 'uniformes' })}
            onOpenEntrenamientos={() => navegar({ vista: 'entrenamientos' })}
          />
        )}
        {ruta.vista === 'equipo' && (
          <EquipoScreen onBack={() => navegar({ vista: 'mas' })} />
        )}
        {ruta.vista === 'ficha' && (
          <Ficha
            alumnoId={ruta.alumnoId}
            onVolver={() => navegar({ vista: 'alumnos' })}
            onEditar={() =>
              navegar({ vista: 'alumnoEditar', alumnoId: ruta.alumnoId })
            }
            onRegistrarPago={(mes) =>
              navegar({ vista: 'pago', alumnoId: ruta.alumnoId, mes })
            }
            onRegistrarUniforme={() =>
              navegar({ vista: 'uniformeEntrega', alumnoId: ruta.alumnoId })
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
        {ruta.vista === 'alumnoNuevo' && (
          <AlumnoForm
            modo="nuevo"
            onVolver={() => navegar({ vista: 'alumnos' })}
            onGuardado={(alumnoId) => navegar({ vista: 'ficha', alumnoId })}
          />
        )}
        {ruta.vista === 'alumnoEditar' && (
          <AlumnoForm
            modo="editar"
            alumnoId={ruta.alumnoId}
            onVolver={() => navegar({ vista: 'ficha', alumnoId: ruta.alumnoId })}
            onGuardado={(alumnoId) => navegar({ vista: 'ficha', alumnoId })}
          />
        )}
        {ruta.vista === 'uniformes' && (
          <Uniformes
            onEntrega={(alumnoId) => navegar({ vista: 'uniformeEntrega', alumnoId })}
          />
        )}
        {ruta.vista === 'uniformeEntrega' && (
          <UniformeEntrega alumnoId={ruta.alumnoId} onVolver={volver} />
        )}
        {ruta.vista === 'entrenamientos' && (
          <Entrenamientos onBack={() => navegar({ vista: 'mas' })} />
        )}
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
          onClose={() => setActionOpen(false)}
        />
      )}
    </>
  );
}

