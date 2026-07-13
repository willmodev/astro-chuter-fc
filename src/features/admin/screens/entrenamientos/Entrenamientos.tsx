import { Icon } from '../../chrome/Icon';
import { WeekChips } from '../../ui/WeekChips';
import { VenueCard } from '../entrenos/VenueCard';
import { GrupoEntrenadorCard } from './GrupoEntrenadorCard';
import { useEntrenamientos } from './useEntrenamientos';

// Entrenamientos (ADMIN · solo lectura, spec 09): por semana y entrenador,
// el plan y las sesiones que registraron los profesores. No edita nada:
// la planificación es responsabilidad del profesor.
interface Props {
  onBack: () => void;
}

export function Entrenamientos({ onBack }: Readonly<Props>) {
  const data = useEntrenamientos();
  const { semana, grupos } = data;

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="arrow-left" size={19} />
        </button>
        <strong style={{ flex: 1, fontSize: 18, color: 'var(--text-strong)' }}>
          Entrenamientos
        </strong>
      </div>

      <VenueCard />

      <span className="eyebrow" style={{ padding: '2px 2px 0' }}>
        Semana {semana.n} · {semana.sub}
      </span>
      <WeekChips semanas={data.semanas} value={semana.id} onChange={data.setWeekId} />

      {grupos.length === 0 ? (
        <p
          style={{
            margin: 0,
            padding: '32px 24px',
            textAlign: 'center',
            fontSize: 13.5,
            color: 'var(--text-muted)',
          }}
        >
          Nada registrado esta semana todavía.
        </p>
      ) : (
        grupos.map((g) => <GrupoEntrenadorCard key={g.id} grupo={g} />)
      )}
    </div>
  );
}
