import { useMemo, useState } from 'react';

import { esMesCobrable, totalPago } from '@/lib/domain/cartera';

import { Icon } from '../../chrome/Icon';
import { registrarPago, type MetodoPago } from '../../data/store';
import type { EstadoMes } from '../../data/types';
import { useAlumno } from '../../hooks/useAlumno';
import { AlumnoNoEncontrado } from '../ficha/AlumnoNoEncontrado';
import { AlDiaAviso } from './AlDiaAviso';
import { ExitoPago } from './ExitoPago';
import { ResumenPago } from './ResumenPago';
import { SelectorMeses } from './SelectorMeses';
import { SelectorMetodo } from './SelectorMetodo';

// Registrar pago (HU-3.5, HU-3.7): selección de meses cobrables + método →
// confirmar muta el store → éxito con recibo por WhatsApp. Solo orquesta;
// reglas de totales viven en `lib/domain/cartera`.
interface Props {
  alumnoId: number;
  mes?: number;
  onVolver: () => void;
}

// Mes tocado → ese mes; sin origen → primer mes cobrable (HU-3.5).
function preseleccion(states: EstadoMes[], mesTocado: number | undefined): number[] {
  const cobrables = states
    .map((estado, i) => (esMesCobrable(estado) ? i : -1))
    .filter((i) => i >= 0);
  if (mesTocado !== undefined && cobrables.includes(mesTocado)) return [mesTocado];
  return cobrables.slice(0, 1);
}

export function Pago({ alumnoId, mes, onVolver }: Readonly<Props>) {
  const alumno = useAlumno(alumnoId);
  const [seleccionados, setSeleccionados] = useState<number[]>(() =>
    alumno ? preseleccion(alumno.states, mes) : [],
  );
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [exito, setExito] = useState(false);

  const total = useMemo(
    () => totalPago(alumno?.cuota ?? 0, seleccionados.length),
    [alumno?.cuota, seleccionados.length],
  );

  if (!alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  const hayCobrables = alumno.states.some((element) => esMesCobrable(element));

  const toggleMes = (i: number): void => {
    setSeleccionados((prev) => (prev.includes(i) ? prev.filter((m) => m !== i) : [...prev, i]));
  };

  const confirmar = (): void => {
    registrarPago(alumno.id, seleccionados, metodo);
    setExito(true);
  };

  if (exito) {
    return <ExitoPago alumno={alumno} meses={seleccionados} total={total} onVolver={onVolver} />;
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver a la ficha"
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
            flexShrink: 0,
          }}
        >
          <Icon name="arrow-left" size={19} />
        </button>
        <div style={{ minWidth: 0 }}>
          <strong
            style={{ display: 'block', fontSize: 16, color: 'var(--text-strong)', lineHeight: 1.2 }}
          >
            {alumno.name}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {alumno.cat} · Registrar pago
          </span>
        </div>
      </div>

      {hayCobrables ? (
        <>
          <SelectorMeses alumno={alumno} seleccionados={seleccionados} onToggle={toggleMes} />
          <SelectorMetodo metodo={metodo} onChange={setMetodo} />
          <ResumenPago
            total={total}
            deshabilitado={seleccionados.length === 0}
            onConfirmar={confirmar}
          />
        </>
      ) : (
        <AlDiaAviso />
      )}
    </div>
  );
}
