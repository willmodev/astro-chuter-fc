import { useState } from 'react';

import { DIAS_ENTRENO, type DiaEntreno } from '@/lib/domain/entrenos';

import { Badge } from '../../ui/Badge';
import { WeekChips } from '../../ui/WeekChips';
import { DayCard } from './DayCard';
import { PlanCard } from './PlanCard';
import { PlanSheet } from './PlanSheet';
import { useEntrenos } from './useEntrenos';
import { VenueCard } from './VenueCard';

// Home del entrenador (spec 09): sede, historial de semanas, plan semanal
// (tema/objetivos en Sheet) y una DayCard por día Lun/Mié/Vie.
interface Props {
  entrenadorId: string;
  entrenadorNombre: string;
  cats: string[];
  onOpenSesion: (weekId: string, day: DiaEntreno) => void;
}

export function Entrenos({
  entrenadorId,
  entrenadorNombre,
  cats,
  onOpenSesion,
}: Readonly<Props>) {
  const data = useEntrenos(entrenadorId, entrenadorNombre, cats);
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const { semana, porRegistrar } = data;

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <VenueCard />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '2px 2px 0',
        }}
      >
        <span className="eyebrow">
          Semana {semana.n} · {semana.sub}
        </span>
        {semana.current && porRegistrar > 0 && (
          <Badge tone="due" dot>
            {porRegistrar} por registrar
          </Badge>
        )}
      </div>

      <WeekChips semanas={data.semanas} value={semana.id} onChange={data.setWeekId} />

      <PlanCard plan={data.plan} onEditar={() => setSheetAbierto(true)} />

      {DIAS_ENTRENO.map((day) => (
        <DayCard
          key={day}
          day={day}
          sesion={data.sesionDeDia(day)}
          roster={data.roster}
          onOpen={() => onOpenSesion(semana.id, day)}
        />
      ))}

      {sheetAbierto && (
        <PlanSheet
          plan={data.plan}
          semanaLabel={semana.label}
          onGuardar={(tema, objetivos) => {
            data.guardarPlan(tema, objetivos);
            setSheetAbierto(false);
          }}
          onClose={() => setSheetAbierto(false)}
        />
      )}
    </div>
  );
}
