import { useMemo, useState } from 'react';

import { carteraVencida, estaEnMora, recaudoAnio } from '@/lib/domain/cartera';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useAlumnos } from '../../hooks/useAlumnos';
import { useVistaCartera } from '../../hooks/useVistaCartera';
import { CabeceraTotales } from './CabeceraTotales';
import { EstadoVacioCartera } from './EstadoVacioCartera';
import { MatrizCartera } from './MatrizCartera';
import { SegmentoFiltro, type SegmentoCartera } from './SegmentoFiltro';
import { TarjetaAlumno } from './TarjetaAlumno';
import { ToggleVista } from './ToggleVista';

// Pantalla Cartera (HU-3.1..3.4): cabecera con totales + toggle
// Tarjetas/Matriz (persistido en localStorage) + segmento Todos/En mora.
// Solo orquesta; totales y filtro viven en `lib/domain`.
// Cobra solo a los activos, pero el recaudo del año suma también lo que ya
// pagó un retirado: ese dinero entró (spec 14).
interface Props {
  onCobrarMes: (alumnoId: number, mesIndex: number) => void;
}

export function Cartera({ onCobrarMes }: Readonly<Props>) {
  const { alumnos, activos, estado, recargar } = useAlumnos(true);
  const [vista, setVista] = useVistaCartera();
  const [segmento, setSegmento] = useState<SegmentoCartera>('todos');

  const enMora = useMemo(() => activos.filter(estaEnMora), [activos]);
  const visibles = segmento === 'mora' ? enMora : activos;

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 24px' }}>
      <CabeceraTotales
        recaudoAnio={recaudoAnio(alumnos)}
        carteraVencida={carteraVencida(activos)}
      />
      <ToggleVista vista={vista} onChange={setVista} />
      <SegmentoFiltro
        segmento={segmento}
        onChange={setSegmento}
        total={activos.length}
        enMora={enMora.length}
      />

      {visibles.length === 0 ? (
        <EstadoVacioCartera />
      ) : vista === 'tarjetas' ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {visibles.map((a) => (
            <TarjetaAlumno
              key={a.id}
              alumno={a}
              onCobrarMes={(mes) => onCobrarMes(a.id, mes)}
            />
          ))}
        </div>
      ) : (
        <MatrizCartera alumnos={visibles} onCobrarMes={onCobrarMes} />
      )}
    </div>
  );
}
