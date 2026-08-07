import { useState } from 'react';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useAlumno } from '../../hooks/useAlumno';

import { AcudienteTab } from './AcudienteTab';
import { AlumnoNoEncontrado } from './AlumnoNoEncontrado';
import { FichaAcciones } from './FichaAcciones';
import { FichaHeader } from './FichaHeader';
import { HojaRetiro } from './HojaRetiro';
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

interface Secciones {
  acciones: boolean;
  pagos: boolean;
  uniforme: boolean;
  acudiente: boolean;
  tabs?: readonly TabFicha[];
}

// Qué se muestra según rol y tab activo (en readOnly no hay nada de plata).
function seccionesVisibles(readOnly: boolean, tab: TabFicha): Secciones {
  return {
    acciones: !readOnly,
    pagos: tab === 'pagos' && !readOnly,
    uniforme: tab === 'uniforme',
    acudiente: tab === 'acudiente',
    tabs: readOnly ? TABS_READONLY : undefined,
  };
}

function tabInicial(readOnly: boolean): TabFicha {
  return readOnly ? 'uniforme' : 'pagos';
}

export function Ficha({
  alumnoId,
  onVolver,
  readOnly = false,
  onEditar,
  onRegistrarPago,
  onRegistrarUniforme,
}: Readonly<Props>) {
  const { alumno, estado, recargar, cambiarActivo } = useAlumno(alumnoId);
  const [tab, setTab] = useState<TabFicha>(() => tabInicial(readOnly));
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const ver = seccionesVisibles(readOnly, tab);

  // Retirar pide confirmación; reactivar se aplica de una (spec 14).
  async function alCambiarActivo(): Promise<void> {
    if (!alumno) return;
    if (alumno.activo) {
      setConfirmando(true);
      return;
    }
    setOcupado(true);
    await cambiarActivo(true);
    setOcupado(false);
  }

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={() => void recargar()} />;
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
      />
      {ver.acciones && (
        <FichaAcciones
          alumno={alumno}
          ocupado={ocupado}
          onRegistrarPago={() => onRegistrarPago?.()}
          onCambiarActivo={() => void alCambiarActivo()}
        />
      )}
      <TabsFicha tab={tab} onTab={setTab} tabs={ver.tabs} />

      {ver.pagos && (
        <PagosDelAnio
          alumno={alumno}
          onCobrarMes={(mes) => onRegistrarPago?.(mes)}
          cobrosHabilitados={alumno.activo}
        />
      )}
      {ver.uniforme && (
        <UniformeTab
          alumno={alumno}
          onGestionar={() => onRegistrarUniforme?.()}
        />
      )}
      {ver.acudiente && <AcudienteTab alumno={alumno} />}

      {confirmando && (
        <HojaRetiro
          nombre={alumno.name}
          onConfirmar={() => cambiarActivo(false)}
          onClose={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}
