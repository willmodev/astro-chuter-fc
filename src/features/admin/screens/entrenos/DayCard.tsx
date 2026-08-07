import { useState } from 'react';

import { type DiaEntreno } from '@/lib/domain/entrenos';
import { listaPasada, planeada } from '@/lib/domain/sesion';

import { VisorImagen } from '../../ui/VisorImagen';

import {
  DayGlyph,
  RegistroLabel,
  ThumbImg,
  ThumbPlaceholder,
  VaciaBody,
  ZONA_RESET,
} from './DayCardParts';

import type { AlumnoPlantel, Sesion } from '../../data/types';

// Card de un día de entrenamiento. 4 estados derivados de la sesión:
// vacía / planeada sin lista / lista sin planeación / completa. La card se
// compone de zonas hermanas (sin interactivos anidados): el thumbnail con
// imagen abre el visor; el resto de la card navega a la sesión.
interface Props {
  day: DiaEntreno;
  sesion: Sesion | null;
  roster: readonly AlumnoPlantel[];
  onOpen: () => void;
}

interface EstadoCard {
  tieneLista: boolean;
  completa: boolean;
  vacia: boolean;
  img: string | null;
}

function estadoDeCard(sesion: Sesion | null): EstadoCard {
  const tienePlan = planeada(sesion);
  const tieneLista = listaPasada(sesion);
  return {
    tieneLista,
    completa: tienePlan && tieneLista,
    vacia: sesion === null || (!tienePlan && !tieneLista),
    img: sesion?.parteCentralImg ?? null,
  };
}

export function DayCard({ day, sesion, roster, onOpen }: Readonly<Props>) {
  const [visor, setVisor] = useState(false);
  const { tieneLista, completa, vacia, img } = estadoDeCard(sesion);

  return (
    <div
      style={{
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
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir la sesión del ${day}`}
        style={{ ...ZONA_RESET, flexShrink: 0 }}
      >
        <DayGlyph day={day} completa={completa} />
      </button>

      {vacia || sesion === null ? (
        <button
          type="button"
          onClick={onOpen}
          style={{ ...ZONA_RESET, flex: 1, minWidth: 0 }}
        >
          <VaciaBody />
        </button>
      ) : (
        <>
          {img !== null ? (
            <button
              type="button"
              onClick={() => setVisor(true)}
              aria-label={`Ampliar la planeación del ${day}`}
              style={{ ...ZONA_RESET, flexShrink: 0, cursor: 'zoom-in' }}
            >
              <ThumbImg src={img} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              style={{ ...ZONA_RESET, flexShrink: 0 }}
            >
              <ThumbPlaceholder />
            </button>
          )}
          <button
            type="button"
            onClick={onOpen}
            style={{ ...ZONA_RESET, flex: 1, minWidth: 0 }}
          >
            <RegistroLabel
              sesion={sesion}
              roster={roster}
              tieneLista={tieneLista}
            />
          </button>
        </>
      )}

      {visor && img !== null && (
        <VisorImagen src={img} onClose={() => setVisor(false)} />
      )}
    </div>
  );
}
