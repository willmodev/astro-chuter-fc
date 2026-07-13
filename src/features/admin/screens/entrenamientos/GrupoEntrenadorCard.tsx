import { Avatar } from '../../ui/Avatar';
import { SesionRow } from './SesionRow';
import type { GrupoEntrenador } from './useEntrenamientos';

// Bloque de un entrenador en la semana: identidad + plan (tema/objetivos)
// + sus sesiones registradas. Solo lectura: la planificación es del profesor.
interface Props {
  grupo: GrupoEntrenador;
}

export function GrupoEntrenadorCard({ grupo }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 2px 0' }}>
        <Avatar name={grupo.nombre} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-strong)' }}>
            {grupo.nombre}
          </div>
          {grupo.cats.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {grupo.cats.join(' · ')}
            </div>
          )}
        </div>
      </div>

      {grupo.plan !== null && (
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span className="eyebrow">Plan de la semana</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>
            {grupo.plan.tema}
          </div>
          {grupo.plan.objetivos !== '' && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-muted)' }}>
              {grupo.plan.objetivos}
            </p>
          )}
        </div>
      )}

      {grupo.sesiones.map((s) => (
        <SesionRow key={s.id} sesion={s} roster={grupo.roster} />
      ))}
    </div>
  );
}
