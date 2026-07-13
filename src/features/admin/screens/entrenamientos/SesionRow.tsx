import { asistenciaDe } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistPill } from '../../ui/AsistPill';
import type { Alumno, Sesion } from '../../data/types';

// Fila de una sesión registrada (vista admin, solo lectura): día, thumbnail
// de la parte central, nota y pastilla de asistencia. Sin acciones.
interface Props {
  sesion: Sesion;
  roster: readonly Alumno[];
}

export function SesionRow({ sesion, roster }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--success)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '12px 15px',
      }}
    >
      <span
        className="font-display"
        style={{
          width: 40,
          flexShrink: 0,
          fontSize: 13,
          color: 'var(--text-muted)',
          letterSpacing: '.04em',
        }}
      >
        {sesion.day.slice(0, 3).toUpperCase()}
      </span>

      {sesion.parteCentralImg !== null ? (
        <img
          src={sesion.parteCentralImg}
          alt={`Parte central del ${sesion.day}`}
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover',
            border: '1px solid var(--border-subtle)',
          }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-sunken)',
            color: 'var(--text-faint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="image-plus" size={18} />
        </span>
      )}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sesion.parteCentralNota || 'Parte central'}
        </span>
        <span style={{ display: 'block', marginTop: 6 }}>
          <AsistPill asistencia={asistenciaDe(sesion, roster)} />
        </span>
      </span>
    </div>
  );
}
