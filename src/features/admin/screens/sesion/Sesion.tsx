import { useEffect } from 'react';

import { FASE_ACTIVACION, FASE_VUELTA_CALMA } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistenciaBloque } from './AsistenciaBloque';
import { BotonGuardar } from './BotonGuardar';
import { FaseFijaCard } from './FaseFijaCard';
import { ParteCentral } from './ParteCentral';
import { useSesion, type ParamsSesion } from './useSesion';

// Sesión del día (spec 10): dos registros independientes con su propio CTA —
// planeación (parte central: imagen + nota, editable en cualquier momento) y
// asistencia (pasar lista, solo desde el día del entreno). La misma pantalla
// registra la semana viva y corrige el historial.
interface Props extends ParamsSesion {
  onVolver: () => void;
  onGuardado: () => void;
}

export function Sesion({ onVolver, onGuardado, ...params }: Readonly<Props>) {
  const s = useSesion(params);

  // weekId inexistente (deep-link viejo o manipulado) → de vuelta a Entrenos.
  useEffect(() => {
    if (s.semana === null) onVolver();
  }, [s.semana, onVolver]);
  if (s.semana === null) return null;

  const guardarPlaneacion = (): void => {
    s.guardarPlaneacion();
    onGuardado();
  };
  const guardarAsistencia = (): void => {
    s.guardarAsistencia();
    onGuardado();
  };

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver a Entrenos"
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="arrow-left" size={19} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 18, color: 'var(--text-strong)' }}>
            {params.day}
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {s.semana.label} · {s.semana.sub}
          </span>
        </div>
      </div>

      <FaseFijaCard icono="flame" fase={FASE_ACTIVACION} />
      <ParteCentral
        img={s.img}
        nota={s.nota}
        setNota={s.setNota}
        onElegirImagen={s.elegirImagen}
      />
      <FaseFijaCard icono="wind" fase={FASE_VUELTA_CALMA} />
      <BotonGuardar label="Guardar planeación" onClick={guardarPlaneacion} />

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />

      <AsistenciaBloque
        puedeLista={s.puedeLista}
        listaExistente={s.listaExistente}
        asistencia={s.asistencia}
        roster={s.roster}
        estaAusente={s.estaAusente}
        onMarcar={s.marcar}
        onGuardar={guardarAsistencia}
      />
      <div style={{ height: 8 }} />
    </div>
  );
}
