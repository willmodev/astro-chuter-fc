import { asistenciaDe, type DiaEntreno } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistPill } from '../../ui/AsistPill';
import type { Alumno, Sesion } from '../../data/types';

// Card de un día de entrenamiento. Registrada: thumbnail de la parte central
// (o placeholder si la imagen se perdió al recargar, mock) + asistencia.
// Sin registrar: CTA "Registrar". Ambas abren la sesión del día.
interface Props {
  day: DiaEntreno;
  sesion: Sesion | null;
  roster: readonly Alumno[];
  onOpen: () => void;
}

export function DayCard({ day, sesion, roster, onOpen }: Readonly<Props>) {
  const registrada = sesion?.registrado === true;
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `4px solid ${registrada ? 'var(--success)' : 'var(--brand-gold)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '13px 15px',
      }}
    >
      <span style={{ width: 46, flexShrink: 0, textAlign: 'center' }}>
        <span
          className="font-display"
          style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '.04em' }}
        >
          {day.slice(0, 3).toUpperCase()}
        </span>
        <span
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 4,
            color: registrada ? 'var(--success-deep)' : 'var(--brand-gold-deep)',
          }}
        >
          <Icon name={registrada ? 'circle-check' : 'circle-plus'} size={20} />
        </span>
      </span>

      {registrada && sesion ? (
        <>
          <Thumbnail src={sesion.parteCentralImg} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--text-strong)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {sesion.parteCentralNota || 'Parte central'}
            </span>
            <span style={{ display: 'block', marginTop: 7 }}>
              <AsistPill asistencia={asistenciaDe(sesion, roster)} />
            </span>
          </span>
          <span style={{ color: 'var(--text-faint)', flexShrink: 0, display: 'flex' }}>
            <Icon name="chevron-right" size={18} />
          </span>
        </>
      ) : (
        <>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
              Sin registrar
            </span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              Sube la planeación y pasa lista
            </span>
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--brand-gold-deep)',
              background: 'var(--brand-gold-soft)',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            Registrar
          </span>
        </>
      )}
    </button>
  );
}

// Miniatura de la imagen de TactalPad; sin imagen (p. ej. tras recargar el
// mock) muestra un placeholder neutro.
function Thumbnail({ src }: Readonly<{ src: string | null }>) {
  if (src === null) {
    return (
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
    );
  }
  return (
    <img
      src={src}
      alt="Parte central"
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: 'var(--radius-md)',
        objectFit: 'cover',
        border: '1px solid var(--border-subtle)',
      }}
    />
  );
}
