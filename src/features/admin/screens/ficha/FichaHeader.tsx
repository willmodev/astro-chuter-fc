import { estadoAlumno } from '@/lib/domain/alumnos';
import { mesesEnMora } from '@/lib/domain/cartera';
import { waTo } from '@/lib/whatsapp';

import { Icon } from '../../chrome/Icon';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import type { Alumno } from '../../data/types';

// Cabecera de la Ficha: volver, identidad (avatar, nombre, categoría),
// estado y acciones "Registrar pago" (placeholder) + WhatsApp real.
interface Props {
  alumno: Alumno;
  onVolver: () => void;
  onEditar: () => void;
  onRegistrarPago: () => void;
}

export function FichaHeader({
  alumno,
  onVolver,
  onEditar,
  onRegistrarPago,
}: Readonly<Props>) {
  const enMora = estadoAlumno(alumno) === 'mora';
  const meses = mesesEnMora(alumno);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver a la lista"
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
        <Avatar name={alumno.name} size={46} ring={enMora} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong
            style={{
              display: 'block',
              fontSize: 17,
              color: 'var(--text-strong)',
              lineHeight: 1.2,
            }}
          >
            {alumno.name}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {alumno.cat}
          </span>
        </div>
        {enMora ? (
          <Badge tone="due">
            {meses} {meses === 1 ? 'mes' : 'meses'}
          </Badge>
        ) : (
          <Badge tone="paid">Al día</Badge>
        )}
        <button
          type="button"
          onClick={onEditar}
          aria-label="Editar alumno"
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
          <Icon name="pencil" size={17} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onRegistrarPago}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Registrar pago
        </button>
        <a
          href={waTo(
            alumno.phone,
            `Hola ${alumno.acu}, te escribimos de Chuter FC sobre ${alumno.name}.`,
          )}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            height: 44,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'color-mix(in srgb, var(--whatsapp) 14%, white)',
            color: 'var(--whatsapp)',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name="message-circle" size={18} /> WhatsApp
        </a>
      </div>
    </div>
  );
}
