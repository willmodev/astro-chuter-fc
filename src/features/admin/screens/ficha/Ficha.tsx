import { useState } from 'react';

import { MESES_VISIBLES, NOMBRE_MES } from '@/lib/domain/cartera';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useAlumno } from '../../hooks/useAlumno';

import { AcudienteTab } from './AcudienteTab';
import { AlumnoNoEncontrado } from './AlumnoNoEncontrado';
import { FichaAcciones } from './FichaAcciones';
import { FichaHeader } from './FichaHeader';
import { HojaAnularPago } from './HojaAnularPago';
import { HojaRetiro } from './HojaRetiro';
import { PagosDelAnio } from './PagosDelAnio';
import { TabsFicha, type TabFicha } from './TabsFicha';
import { UniformeTab } from './UniformeTab';

// Ficha del alumno del ADMIN (HU-2.3): cabecera con acciones + tabs Pagos /
// Uniforme / Acudiente. La ficha del entrenador es otro componente sin dinero
// (`screens/plantel/FichaPlantel.tsx`, spec 09).
// Solo orquesta; reglas en dominio, datos en hook.
interface Props {
  alumnoId: number;
  onVolver: () => void;
  onEditar: () => void;
  // Siempre con mes: la única entrada a cobro desde la ficha es tocar el mes.
  onRegistrarPago: (mes: number) => void;
  onRegistrarUniforme: () => void;
}

export function Ficha({
  alumnoId,
  onVolver,
  onEditar,
  onRegistrarPago,
  onRegistrarUniforme,
}: Readonly<Props>) {
  const { alumno, pagos, estado, recargar, cambiarActivo, anularPago } =
    useAlumno(alumnoId);
  const [tab, setTab] = useState<TabFicha>('pagos');
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  // Índice dentro de la tira visible del mes cuya anulación se está confirmando.
  const [anulandoMes, setAnulandoMes] = useState<number | null>(null);

  const mesAnular =
    anulandoMes === null ? undefined : MESES_VISIBLES[anulandoMes];
  const pagoAnular = pagos.find((p) => p.mes === mesAnular);

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
      <FichaHeader alumno={alumno} onVolver={onVolver} onEditar={onEditar} />
      <FichaAcciones
        alumno={alumno}
        ocupado={ocupado}
        onCambiarActivo={() => void alCambiarActivo()}
      />
      <TabsFicha tab={tab} onTab={setTab} />

      {tab === 'pagos' && (
        <PagosDelAnio
          alumno={alumno}
          onCobrarMes={(mes) => {
            onRegistrarPago(mes);
          }}
          onAnularMes={setAnulandoMes}
          cobrosHabilitados={alumno.activo}
        />
      )}
      {tab === 'uniforme' && (
        <UniformeTab alumno={alumno} onGestionar={onRegistrarUniforme} />
      )}
      {tab === 'acudiente' && <AcudienteTab alumno={alumno} />}

      {mesAnular && pagoAnular && (
        <HojaAnularPago
          nombreMes={NOMBRE_MES[mesAnular]}
          pago={pagoAnular}
          onConfirmar={(motivo) => anularPago(mesAnular, motivo)}
          onClose={() => {
            setAnulandoMes(null);
          }}
        />
      )}

      {confirmando && (
        <HojaRetiro
          nombre={alumno.name}
          onConfirmar={() => cambiarActivo(false)}
          onClose={() => {
            setConfirmando(false);
          }}
        />
      )}
    </div>
  );
}
