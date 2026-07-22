import type { EntrenoDeHoy, EntrenoDeHoyFila } from '@/lib/services/entreno-de-hoy';

import { SectionLabel } from '../../chrome/SectionLabel';
import { AsistPill } from '../../ui/AsistPill';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';

// Card del dashboard (HU-4.6): "¿cómo va el registro de hoy?". Una fila por
// entrenador con su estado del día; solo aparece en días Lun/Mié/Vie.
interface Props {
  entreno: EntrenoDeHoy;
  onOpen: () => void;
}

function Estado({ fila }: Readonly<{ fila: EntrenoDeHoyFila }>) {
  if (fila.asistencia) return <AsistPill asistencia={fila.asistencia} />;
  if (fila.registrado)
    return (
      <Badge tone="pending" dot>
        Sin lista
      </Badge>
    );
  return (
    <Badge tone="due" dot>
      Sin registrar
    </Badge>
  );
}

function Fila({ fila }: Readonly<{ fila: EntrenoDeHoyFila }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px' }}>
      <Avatar name={fila.entrenadorNombre} size={30} />
      {fila.parteCentralUrl !== null ? (
        <img
          src={fila.parteCentralUrl}
          alt=""
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover',
            border: '1px solid var(--border-subtle)',
          }}
        />
      ) : null}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13.5,
          fontWeight: 700,
          color: 'var(--text-strong)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {fila.entrenadorNombre}
      </span>
      <Estado fila={fila} />
    </div>
  );
}

export function EntrenoDeHoyCard({ entreno, onOpen }: Readonly<Props>) {
  return (
    <>
      <SectionLabel
        action={
          <button
            type="button"
            onClick={onOpen}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-navy)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Ver entrenamientos
          </button>
        }
      >
        Entreno de hoy · {entreno.dia}
      </SectionLabel>
      <div
        style={{
          margin: '0 16px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'grid',
        }}
      >
        {entreno.filas.map((fila, i) => (
          <div
            key={fila.entrenadorId}
            style={{
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <Fila fila={fila} />
          </div>
        ))}
      </div>
    </>
  );
}
