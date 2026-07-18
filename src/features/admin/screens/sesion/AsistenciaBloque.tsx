import type { ResumenAsistencia } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistenciaLista } from './AsistenciaLista';
import { BotonGuardar } from './BotonGuardar';
import type { AlumnoPlantel } from '../../data/types';

// Bloque de asistencia con CTA propio. Gate por fecha: un día que aún no llega
// se muestra deshabilitado con hint; el día del entreno (o pasado) se puede
// pasar y corregir. La lista solo se persiste al pulsar "Guardar asistencia".
interface Props {
  puedeLista: boolean;
  listaExistente: boolean;
  asistencia: ResumenAsistencia;
  roster: readonly AlumnoPlantel[];
  estaAusente: (alumnoId: number) => boolean;
  onMarcar: (alumnoId: number, presente: boolean) => void;
  onGuardar: () => void;
}

export function AsistenciaBloque({
  puedeLista,
  listaExistente,
  asistencia,
  roster,
  estaAusente,
  onMarcar,
  onGuardar,
}: Readonly<Props>) {
  if (!puedeLista) return <ListaDeshabilitada />;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 2px 0',
        }}
      >
        <span className="eyebrow">Pasar lista</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color:
              asistencia.ausentes > 0 ? 'var(--error-deep)' : 'var(--success-deep)',
          }}
        >
          {asistencia.presentes}/{asistencia.total} presentes
        </span>
      </div>
      <AsistenciaLista
        roster={roster}
        estaAusente={estaAusente}
        onMarcar={onMarcar}
      />
      <BotonGuardar
        label={listaExistente ? 'Guardar cambios de lista' : 'Guardar asistencia'}
        onClick={onGuardar}
      />
    </>
  );
}

// Día futuro: aún no tiene sentido pasar lista. Se muestra el bloque atenuado
// con el motivo, sin toggles.
function ListaDeshabilitada() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 15px',
        background: 'var(--surface-sunken)',
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-muted)',
      }}
    >
      <Icon name="clock" size={18} />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: 13.5, color: 'var(--text-strong)' }}>
          Lista no disponible
        </strong>
        <span style={{ fontSize: 12 }}>Disponible el día del entreno</span>
      </div>
    </div>
  );
}
