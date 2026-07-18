import { AdminShell } from './chrome/AdminShell';
import { TABS_ENTRENADOR, type TabId } from './chrome/tabs';
import { useAdminRouter } from './router/useAdminRouter';
import { Entrenos } from './screens/entrenos/Entrenos';
import { FichaPlantel } from './screens/plantel/FichaPlantel';
import { MasEntrenador } from './screens/mas/MasEntrenador';
import { Plantel } from './screens/plantel/Plantel';
import { Sesion } from './screens/sesion/Sesion';
import type { RutaAdmin } from './router/types';

export interface EntrenadorAppProps {
  userId: string;
  userName: string;
  cats: string[];
}

// App del entrenador (spec 09): Entrenos / Alumnos (plantel) / Más, sin FAB.
// El gate del router garantiza que solo monta sus vistas; las pantallas
// reales llegan en los bloques C y D (hoy: stubs).
type Meta = { title: string; eyebrow: string };

const META_DEFAULT: Meta = { title: 'Entrenos', eyebrow: 'Planificación semanal' };

const META: Partial<Record<RutaAdmin['vista'], Meta>> = {
  entrenos: META_DEFAULT,
  sesion: { title: 'Sesión', eyebrow: 'Registro del día' },
  plantel: { title: 'Alumnos', eyebrow: 'Mis categorías' },
  ficha: { title: 'Alumnos', eyebrow: 'Ficha del alumno' },
  mas: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
};

// La sesión cuelga de Entrenos y la ficha del plantel.
const TAB_DE_VISTA: Partial<Record<RutaAdmin['vista'], TabId>> = {
  entrenos: 'entrenos',
  sesion: 'entrenos',
  plantel: 'plantel',
  ficha: 'plantel',
  mas: 'mas',
};

const RUTA_DE_TAB: Partial<Record<TabId, RutaAdmin>> = {
  entrenos: { vista: 'entrenos' },
  plantel: { vista: 'plantel' },
  mas: { vista: 'mas' },
};

export function EntrenadorApp({ userId, userName, cats }: Readonly<EntrenadorAppProps>) {
  const { ruta, navegar } = useAdminRouter('entrenador');
  const meta = META[ruta.vista] ?? META_DEFAULT;

  const navegarTab = (tab: TabId) => {
    const destino = RUTA_DE_TAB[tab];
    if (destino) navegar(destino);
  };

  return (
    <AdminShell
      tabs={TABS_ENTRENADOR}
      active={TAB_DE_VISTA[ruta.vista] ?? 'entrenos'}
      onTab={navegarTab}
      title={meta.title}
      eyebrow={meta.eyebrow}
    >
      {ruta.vista === 'entrenos' && (
        <Entrenos
          entrenadorId={userId}
          entrenadorNombre={userName}
          cats={cats}
          onOpenSesion={(weekId, day) => navegar({ vista: 'sesion', weekId, day })}
        />
      )}
      {ruta.vista === 'sesion' && (
        <Sesion
          entrenadorId={userId}
          entrenadorNombre={userName}
          cats={cats}
          weekId={ruta.weekId}
          day={ruta.day}
          onVolver={() => navegar({ vista: 'entrenos' })}
          onGuardado={() => navegar({ vista: 'entrenos' })}
        />
      )}
      {ruta.vista === 'plantel' && (
        <Plantel
          cats={cats}
          onOpenFicha={(alumnoId) => navegar({ vista: 'ficha', alumnoId })}
        />
      )}
      {ruta.vista === 'ficha' && (
        <FichaPlantel
          alumnoId={ruta.alumnoId}
          onVolver={() => navegar({ vista: 'plantel' })}
        />
      )}
      {ruta.vista === 'mas' && <MasEntrenador userName={userName} cats={cats} />}
    </AdminShell>
  );
}
