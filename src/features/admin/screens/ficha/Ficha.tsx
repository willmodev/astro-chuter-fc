import { useState } from 'react';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useAlumno } from '../../hooks/useAlumno';
import { AcudienteTab } from './AcudienteTab';
import { AlumnoNoEncontrado } from './AlumnoNoEncontrado';
import { FichaHeader } from './FichaHeader';
import { PagosDelAnio } from './PagosDelAnio';
import { TabsFicha, type TabFicha } from './TabsFicha';
import { UniformeTab } from './UniformeTab';

// Ficha del alumno (HU-2.3): cabecera con acciones + tabs Pagos /
// Uniforme / Acudiente. En modo readOnly (entrenador, spec 09) desaparece
// todo lo de plata: tab Pagos, mora, pago del uniforme y acciones de
// escritura. Solo orquesta; reglas en dominio, datos en hook.
interface Props {
  alumnoId: number;
  onVolver: () => void;
  readOnly?: boolean;
  onEditar?: () => void;
  onRegistrarPago?: (mes?: number) => void;
  onRegistrarUniforme?: () => void;
}

const TABS_READONLY: readonly TabFicha[] = ['uniforme', 'acudiente'];

export function Ficha({
  alumnoId,
  onVolver,
  readOnly = false,
  onEditar,
  onRegistrarPago,
}: Readonly<Props>) {
  const { alumno, estado, recargar } = useAlumno(alumnoId);
  const [tab, setTab] = useState<TabFicha>(readOnly ? 'uniforme' : 'pagos');

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }
  if (!alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 0' }}>
      <FichaHeader
        alumno={alumno}
        onVolver={onVolver}
        readOnly={readOnly}
        onEditar={onEditar}
        onRegistrarPago={() => onRegistrarPago?.()}
      />
      <TabsFicha
        tab={tab}
        onTab={setTab}
        tabs={readOnly ? TABS_READONLY : undefined}
      />

      {tab === 'pagos' && !readOnly && (
        <PagosDelAnio alumno={alumno} onCobrarMes={(mes) => onRegistrarPago?.(mes)} />
      )}
      {tab === 'uniforme' && <UniformeTab />}
      {tab === 'acudiente' && <AcudienteTab alumno={alumno} />}
    </div>
  );
}
