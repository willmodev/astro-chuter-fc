import { asistenciaDe, type DiaEntreno } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistPill } from '../../ui/AsistPill';
import { Badge } from '../../ui/Badge';
import type { Alumno, Sesion } from '../../data/types';

// Piezas presentacionales de la DayCard (spec 10-C/D). Se separan del archivo
// principal para mantener cada uno bajo 200 líneas.

// Reset visual de los botones-zona de la card (el borde/fondo lo pone el
// contenedor; cada zona es solo un área clickeable).
export const ZONA_RESET = {
  border: 'none',
  background: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  textAlign: 'left',
  color: 'inherit',
  font: 'inherit',
  display: 'flex',
  alignItems: 'center',
} as const;

// Columna de la izquierda: día abreviado + icono de estado.
export function DayGlyph({ day, completa }: Readonly<{ day: DiaEntreno; completa: boolean }>) {
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
export function VaciaBody() {
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

// Título (nota o "Sin planeación") + pastilla de asistencia/estado de lista.
export function RegistroLabel({
  sesion,
  roster,
  tieneLista,
}: Readonly<{ sesion: Sesion; roster: readonly Alumno[]; tieneLista: boolean }>) {
  const conPlan = sesion.parteCentralNota.trim() !== '' || sesion.parteCentralImg !== null;
  return (
    <>
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

// Miniatura de TactalPad. Con imagen es clickeable (abre el visor); sin imagen
// es un placeholder neutro que navega a la sesión como el resto de la card.
export function ThumbImg({ src }: Readonly<{ src: string }>) {
  return (
    <img
      src={src}
      alt="Parte central"
      style={{
        width: 44,
        height: 44,
        display: 'block',
        borderRadius: 'var(--radius-md)',
        objectFit: 'cover',
        border: '1px solid var(--border-subtle)',
      }}
    />
  );
}

export function ThumbPlaceholder() {
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
