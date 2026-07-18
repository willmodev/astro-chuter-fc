import {
  asistenciaDe,
  listaPasada,
  planeada,
  type DiaEntreno,
} from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistPill } from '../../ui/AsistPill';
import { Badge } from '../../ui/Badge';
import type { Alumno, Sesion } from '../../data/types';

// Card de un día de entrenamiento. 4 estados derivados de la sesión:
// vacía / planeada sin lista / lista sin planeación / completa. La card
// entera abre la sesión del día (el thumbnail-visor se separa en el spec 10-D).
interface Props {
  day: DiaEntreno;
  sesion: Sesion | null;
  roster: readonly Alumno[];
  onOpen: () => void;
}

export function DayCard({ day, sesion, roster, onOpen }: Readonly<Props>) {
  const tienePlan = planeada(sesion);
  const tieneLista = listaPasada(sesion);
  const completa = tienePlan && tieneLista;

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
        borderLeft: `4px solid ${completa ? 'var(--success)' : 'var(--brand-gold)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '13px 15px',
      }}
    >
      <DayGlyph day={day} completa={completa} />
      {sesion === null || (!tienePlan && !tieneLista) ? (
        <VaciaBody />
      ) : (
        <RegistroBody sesion={sesion} roster={roster} tieneLista={tieneLista} />
      )}
    </button>
  );
}

// Columna de la izquierda: día abreviado + icono de estado.
function DayGlyph({ day, completa }: Readonly<{ day: DiaEntreno; completa: boolean }>) {
  return (
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
          color: completa ? 'var(--success-deep)' : 'var(--brand-gold-deep)',
        }}
      >
        <Icon name={completa ? 'circle-check' : 'circle-plus'} size={20} />
      </span>
    </span>
  );
}

// Estado vacío: ni planeación ni lista. CTA para registrar.
function VaciaBody() {
  return (
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
  );
}

// Estados con registro: planeada sin lista, lista sin planeación o completa.
function RegistroBody({
  sesion,
  roster,
  tieneLista,
}: Readonly<{ sesion: Sesion; roster: readonly Alumno[]; tieneLista: boolean }>) {
  const conPlan = sesion.parteCentralNota.trim() !== '' || sesion.parteCentralImg !== null;
  return (
    <>
      <Thumbnail src={sesion.parteCentralImg} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 700,
            color: conPlan ? 'var(--text-strong)' : 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {conPlan ? sesion.parteCentralNota || 'Parte central' : 'Sin planeación'}
        </span>
        <span style={{ display: 'block', marginTop: 7 }}>
          {tieneLista ? (
            <AsistPill asistencia={asistenciaDe(sesion.ausentes ?? [], roster)} />
          ) : (
            <Badge tone="pending" dot>
              Sin lista
            </Badge>
          )}
        </span>
      </span>
      <span style={{ color: 'var(--text-faint)', flexShrink: 0, display: 'flex' }}>
        <Icon name="chevron-right" size={18} />
      </span>
    </>
  );
}

// Miniatura de la imagen de TactalPad; sin imagen (p. ej. tras recargar el
// mock, o lista sin planeación) muestra un placeholder neutro.
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
