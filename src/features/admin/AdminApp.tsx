import { useState } from 'react';

import { AccionRapidaMenu } from './chrome/AccionRapidaMenu';
import { AdminShell } from './chrome/AdminShell';
import { IconButton } from './chrome/IconButton';
import { TABS_ADMIN, type TabId } from './chrome/tabs';
import { EntrenadorApp } from './EntrenadorApp';
import { useDashboardData } from './hooks/useDashboardData';
import { useAdminRouter } from './router/useAdminRouter';
import { AlumnoForm } from './screens/alumno-form/AlumnoForm';
import { Dashboard } from './screens/dashboard/Dashboard';
import { EnConstruccion } from './screens/EnConstruccion';
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

// La vista activa la decide la URL (useAdminRouter). Las vistas del
// entrenador (entrenos/sesion/plantel) nunca llegan acá: el gate del router
// las convierte en 'entrenamientos'; sus entradas son inertes (exhaustividad).
const META: Record<RutaAdmin['vista'], { title: string; eyebrow: string }> = {
  dashboard: { title: 'Dashboard', eyebrow: 'Temporada 2026' },
  alumnos: { title: 'Alumnos', eyebrow: 'Inscripciones' },
  ficha: { title: 'Alumnos', eyebrow: 'Ficha del alumno' },
  alumnoNuevo: { title: 'Alumnos', eyebrow: 'Inscribir alumno' },
  alumnoEditar: { title: 'Alumnos', eyebrow: 'Editar alumno' },
  cartera: { title: 'Cartera', eyebrow: 'Control de cobros' },
  pago: { title: 'Cartera', eyebrow: 'Registrar pago' },
  uniformes: { title: 'Uniformes', eyebrow: 'Control de kits' },
  uniformeEntrega: { title: 'Alumnos', eyebrow: 'Registrar uniforme' },
  mas: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
  equipo: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
  entrenamientos: { title: 'Más', eyebrow: 'Entrenamientos' },
  entrenos: { title: 'Más', eyebrow: 'Entrenamientos' },
  sesion: { title: 'Más', eyebrow: 'Entrenamientos' },
  plantel: { title: 'Más', eyebrow: 'Entrenamientos' },
};

// Tab resaltada en la navegación para cada vista (Ficha/form/entrega cuelgan de
// Alumnos, Equipo/Uniformes/Entrenamientos cuelgan de Más, Pago de Cartera).
const TAB_DE_VISTA: Record<RutaAdmin['vista'], TabId> = {
  dashboard: 'dashboard',
  alumnos: 'alumnos',
  ficha: 'alumnos',
  alumnoNuevo: 'alumnos',
  alumnoEditar: 'alumnos',
  cartera: 'cartera',
  pago: 'cartera',
  uniformes: 'mas',
  uniformeEntrega: 'alumnos',
  mas: 'mas',
  equipo: 'mas',
  entrenamientos: 'mas',
  entrenos: 'mas',
  sesion: 'mas',
  plantel: 'mas',
};

const RUTA_DE_TAB: Record<TabId, RutaAdmin> = {
  dashboard: { vista: 'dashboard' },
  alumnos: { vista: 'alumnos' },
  cartera: { vista: 'cartera' },
  mas: { vista: 'mas' },
  entrenos: { vista: 'entrenos' },
  plantel: { vista: 'plantel' },
};

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
        tabs={TABS_ADMIN}
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
            onOpenUniformes={() => navegar({ vista: 'uniformes' })}
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
          <EnConstruccion nombre="Entrenamientos" />
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

