import { Avatar } from '../../ui/Avatar';
import type { Alumno } from '../../data/types';

// Pasar lista: una fila por alumno del roster con toggles P/A. Presentes =
// roster − ausentes; el estado vive en el hook de la sesión.
interface Props {
  roster: readonly Alumno[];
  estaAusente: (alumnoId: number) => boolean;
  onMarcar: (alumnoId: number, presente: boolean) => void;
}

export function AsistenciaLista({ roster, estaAusente, onMarcar }: Readonly<Props>) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {roster.map((a, i) => (
        <div
          key={a.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '9px 12px 9px 14px',
            borderTop: i ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <Avatar name={a.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--text-strong)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {a.name}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.cat}</div>
          </div>
          <ToggleAsistencia
            ausente={estaAusente(a.id)}
            onMarcar={(presente) => onMarcar(a.id, presente)}
          />
        </div>
      ))}
    </div>
  );
}

function ToggleAsistencia({
  ausente,
  onMarcar,
}: Readonly<{ ausente: boolean; onMarcar: (presente: boolean) => void }>) {
  const boton = (letra: 'P' | 'A', activo: boolean, color: string, presente: boolean) => (
    <button
      type="button"
      onClick={() => onMarcar(presente)}
      aria-pressed={activo}
      aria-label={presente ? 'Presente' : 'Ausente'}
      style={{
        width: 36,
        height: 34,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 14,
        border: `1.5px solid ${activo ? color : 'var(--border-subtle)'}`,
        background: activo ? color : 'var(--surface-card)',
        color: activo ? '#fff' : 'var(--text-faint)',
      }}
    >
      {letra}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      {boton('P', !ausente, 'var(--success)', true)}
      {boton('A', ausente, 'var(--error)', false)}
    </div>
  );
}
