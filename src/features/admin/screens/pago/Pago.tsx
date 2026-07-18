import { actions } from 'astro:actions';
import { useEffect, useMemo, useState } from 'react';

import {
  esMesCobrable,
  MESES_VISIBLES,
  totalPago,
  type MetodoPago,
} from '@/lib/domain/cartera';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { Icon } from '../../chrome/Icon';
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
  const { alumno, estado, recargar } = useAlumno(alumnoId);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // La preselección se aplica cuando el alumno termina de cargar (async).
  useEffect(() => {
    if (alumno) setSeleccionados(preseleccion(alumno.states, mes));
  }, [alumno, mes]);

  const total = useMemo(
    () => totalPago(alumno?.cuota ?? 0, seleccionados.length),
    [alumno?.cuota, seleccionados.length],
  );

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }
  if (!alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  const hayCobrables = alumno.states.some((element) => esMesCobrable(element));

  const toggleMes = (i: number): void => {
    setSeleccionados((prev) => (prev.includes(i) ? prev.filter((m) => m !== i) : [...prev, i]));
  };

  const confirmar = async (): Promise<void> => {
    setEnviando(true);
    setErrorMsg(null);
    const { error } = await actions.pagos.registrar({
      alumnoId: alumno.id,
      anio: new Date().getFullYear(),
      meses: seleccionados.map((i) => MESES_VISIBLES[i]),
      metodo,
    });
    setEnviando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
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
          {errorMsg && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', fontWeight: 600 }}>
              {errorMsg}
            </p>
          )}
          <ResumenPago
            total={total}
            deshabilitado={seleccionados.length === 0 || enviando}
            onConfirmar={() => void confirmar()}
          />
        </>
      ) : (
        <AlDiaAviso />
      )}
    </div>
  );
}
