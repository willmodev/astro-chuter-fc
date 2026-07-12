import { useState } from 'react';

import { useAlumno } from '../../hooks/useAlumno';
import { AcudienteTab } from './AcudienteTab';
import { AlumnoNoEncontrado } from './AlumnoNoEncontrado';
import { FichaHeader } from './FichaHeader';
import { PagosDelAnio } from './PagosDelAnio';
import { TabsFicha, type TabFicha } from './TabsFicha';
import { UniformeTab } from './UniformeTab';

// Ficha del alumno (HU-2.3): cabecera con acciones + tabs Pagos /
// Uniforme / Acudiente. Solo orquesta; reglas en dominio, datos en hook.
interface Props {
  alumnoId: number;
  onVolver: () => void;
  onEditar: () => void;
  onRegistrarPago: (mes?: number) => void;
  onRegistrarUniforme: () => void;
}

export function Ficha({
  alumnoId,
  onVolver,
  onEditar,
  onRegistrarPago,
  onRegistrarUniforme,
}: Readonly<Props>) {
  const alumno = useAlumno(alumnoId);
  const [tab, setTab] = useState<TabFicha>('pagos');

  if (!alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 0' }}>
      <FichaHeader
        alumno={alumno}
        onVolver={onVolver}
        onEditar={onEditar}
        onRegistrarPago={() => onRegistrarPago()}
      />
      <TabsFicha tab={tab} onTab={setTab} />

      {tab === 'pagos' && <PagosDelAnio alumno={alumno} onCobrarMes={onRegistrarPago} />}
      {tab === 'uniforme' && (
        <UniformeTab alumno={alumno} onRegistrarEntrega={onRegistrarUniforme} />
      )}
      {tab === 'acudiente' && <AcudienteTab alumno={alumno} />}
    </div>
  );
}
