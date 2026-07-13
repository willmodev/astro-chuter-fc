import { useEffect } from 'react';

import { FASE_ACTIVACION, FASE_VUELTA_CALMA } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';
import { AsistenciaLista } from './AsistenciaLista';
import { FaseFijaCard } from './FaseFijaCard';
import { ParteCentral } from './ParteCentral';
import { useSesion, type ParamsSesion } from './useSesion';

// Sesión del día (spec 09): fases fijas arriba/abajo, la parte central como
// imagen de TactalPad + nota, y pasar lista. La misma pantalla registra la
// semana viva y corrige el historial.
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
            color: s.asistencia.ausentes > 0 ? 'var(--error-deep)' : 'var(--success-deep)',
          }}
        >
          {s.asistencia.presentes}/{s.asistencia.total} presentes
        </span>
      </div>
      <AsistenciaLista roster={s.roster} estaAusente={s.estaAusente} onMarcar={s.marcar} />

      <button
        type="button"
        onClick={() => {
          s.guardar();
          onGuardado();
        }}
        style={{
          height: 48,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--brand-gold)',
          color: 'var(--text-on-gold)',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Icon name="check" size={17} strokeWidth={2.4} />
        {s.existente ? 'Guardar cambios' : 'Guardar entrenamiento'}
      </button>
    </div>
  );
}
