import { useState } from 'react';

import { ProximamenteDialog } from '../../chrome/ProximamenteDialog';
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
}

export function Ficha({ alumnoId, onVolver }: Readonly<Props>) {
  const alumno = useAlumno(alumnoId);
  const [tab, setTab] = useState<TabFicha>('pagos');
  const [aviso, setAviso] = useState<string | null>(null);

  if (!alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 0' }}>
      <FichaHeader
        alumno={alumno}
        onVolver={onVolver}
        onRegistrarPago={() =>
          setAviso('El registro de pagos llega en el spec de Cartera.')
        }
      />
      <TabsFicha tab={tab} onTab={setTab} />

      {tab === 'pagos' && (
        <PagosDelAnio
          alumno={alumno}
          onCobrarMes={(mesLong) =>
            setAviso(`El cobro de ${mesLong} llega en el spec de Cartera.`)
          }
        />
      )}
      {tab === 'uniforme' && (
        <UniformeTab
          alumno={alumno}
          onRegistrarEntrega={() =>
            setAviso('El registro de entregas llega en el spec de Uniformes.')
          }
        />
      )}
      {tab === 'acudiente' && <AcudienteTab alumno={alumno} />}

      {aviso && (
        <ProximamenteDialog
          eyebrow="Ficha del alumno"
          mensaje={aviso}
          onClose={() => setAviso(null)}
        />
      )}
    </div>
  );
}
