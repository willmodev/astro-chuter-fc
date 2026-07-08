import { estadoAlumno } from '@/lib/domain/alumnos';
import { saldoPendiente } from '@/lib/domain/cartera';
import { fmt } from '@/lib/format';

import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import type { Alumno } from '../../data/types';
import { TiraMeses } from './TiraMeses';

// Tarjeta de cartera (HU-3.2): alumno, categoría, cuota/mes, saldo o
// "Al día", y tira de meses. Tocar una celda cobrable navega a Registrar pago.
interface Props {
  alumno: Alumno;
  onCobrarMes: (mesIndex: number) => void;
}

export function TarjetaAlumno({ alumno, onCobrarMes }: Readonly<Props>) {
  const enMora = estadoAlumno(alumno) === 'mora';
  const saldo = saldoPendiente(alumno);

  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={alumno.name} size={38} ring={enMora} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: 'block',
              fontSize: 14.5,
              color: 'var(--text-strong)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {alumno.name}
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {alumno.cat} · {fmt(alumno.cuota)}/mes
          </span>
        </div>
        {enMora ? <Badge tone="due">{fmt(saldo)}</Badge> : <Badge tone="paid">Al día</Badge>}
      </div>
      <TiraMeses states={alumno.states} onTocarMes={onCobrarMes} />
    </div>
  );
}
