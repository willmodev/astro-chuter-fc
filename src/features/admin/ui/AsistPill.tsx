import { Badge, type BadgeTone } from './Badge';

import type { ResumenAsistencia } from '@/lib/domain/entrenos';

// Pastilla presentes/total de una sesión. Tono según el prototipo: sin
// ausentes = verde; asistencia ≥ 70% = info; por debajo = alerta.
interface Props {
  asistencia: ResumenAsistencia;
}

function tonoDe({ ausentes, pct }: ResumenAsistencia): BadgeTone {
  if (ausentes === 0) return 'paid';
  return pct >= 70 ? 'info' : 'due';
}

export function AsistPill({ asistencia }: Readonly<Props>) {
  return (
    <Badge tone={tonoDe(asistencia)} dot>
      {asistencia.presentes}/{asistencia.total} presentes
    </Badge>
  );
}
