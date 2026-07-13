import { AdminShell } from './chrome/AdminShell';
import { TABS_ENTRENADOR, type TabId } from './chrome/tabs';
import { useAdminRouter } from './router/useAdminRouter';
import { EnConstruccion } from './screens/EnConstruccion';
import { MasMenu } from './screens/mas/MasMenu';
import type { RutaAdmin } from './router/types';

export interface EntrenadorAppProps {
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

export function EntrenadorApp({ userName, cats }: Readonly<EntrenadorAppProps>) {
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
      {ruta.vista === 'entrenos' && <EnConstruccion nombre="Entrenos" />}
      {ruta.vista === 'sesion' && (
        <EnConstruccion nombre={`Sesión ${ruta.day} (${ruta.weekId})`} />
      )}
      {ruta.vista === 'plantel' && (
        <EnConstruccion nombre={`Plantel (${cats.join(', ') || 'sin categorías'})`} />
      )}
      {ruta.vista === 'ficha' && <EnConstruccion nombre="Ficha readOnly" />}
      {/* Variante propia del entrenador en el bloque D; mientras tanto la
          compartida (su botón Uniformes rebota en el gate hacia Entrenos). */}
      {ruta.vista === 'mas' && (
        <MasMenu
          userName={userName}
          role="entrenador"
          onOpenEquipo={() => navegar({ vista: 'entrenos' })}
          onOpenUniformes={() => navegar({ vista: 'entrenos' })}
        />
      )}
    </AdminShell>
  );
}
