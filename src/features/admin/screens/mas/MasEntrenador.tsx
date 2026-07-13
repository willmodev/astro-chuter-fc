import { useSyncExternalStore } from 'react';

import { rosterDe } from '@/lib/domain/entrenos';
import { LOCATION } from '@/lib/site';

import { Icon, type IconName } from '../../chrome/Icon';
import { getAlumnos, subscribe } from '../../data/store';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { useLogout } from './useLogout';

// Más del entrenador (spec 09): perfil (nombre + cats), sede/horario y
// cerrar sesión. Variante de MasMenu sin entradas de administración.
interface Props {
  userName: string;
  cats: string[];
}

export function MasEntrenador({ userName, cats }: Readonly<Props>) {
  const alumnos = useSyncExternalStore(subscribe, getAlumnos);
  const { saliendo, cerrarSesion } = useLogout();
  const roster = rosterDe(cats, alumnos);

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 0' }}>
      <div
        className="bg-pitch-lines"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 18,
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(160deg, var(--brand-navy), var(--brand-navy-deep))',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Avatar name={userName || 'Entrenador'} size={52} ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
            {userName || 'Entrenador'}
          </div>
          <div
            className="eyebrow"
            style={{ color: 'var(--brand-gold)', marginTop: 2 }}
          >
            Profesor
          </div>
        </div>
      </div>

      <span className="eyebrow" style={{ padding: '2px 2px 0' }}>
        Mis categorías · {roster.length} {roster.length === 1 ? 'alumno' : 'alumnos'}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {cats.length > 0 ? (
          cats.map((c) => (
            <Badge key={c} tone="gold">
              {c}
            </Badge>
          ))
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Sin categorías asignadas
          </span>
        )}
      </div>

      <span className="eyebrow" style={{ padding: '2px 2px 0' }}>
        Sede y horario
      </span>
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <InfoRow
          icon="map-pin"
          title={LOCATION.venue}
          sub={`${LOCATION.neighborhood} · INDER`}
        />
        <InfoRow icon="clock" title="Lun · Mié · Vie" sub="4:30 – 6:00 PM" borde />
      </div>

      <button
        type="button"
        onClick={() => void cerrarSesion()}
        disabled={saliendo}
        style={{
          height: 48,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--error)',
          background: 'var(--error-soft)',
          color: 'var(--error-deep)',
          fontSize: 15,
          fontWeight: 600,
          cursor: saliendo ? 'progress' : 'pointer',
          opacity: saliendo ? 0.65 : 1,
        }}
      >
        {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  sub,
  borde = false,
}: Readonly<{ icon: IconName; title: string; sub: string; borde?: boolean }>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '13px 16px',
        borderTop: borde ? '1px solid var(--border-subtle)' : 'none',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-md)',
          background: 'var(--info-soft)',
          color: 'var(--brand-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={19} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  );
}
