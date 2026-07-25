import type { CSSProperties } from 'react';

import { waTo } from '@/lib/whatsapp';

import { Icon } from '../../chrome/Icon';
import type { Alumno } from '../../data/types';

// Acciones de la ficha (solo admin): cobrar, escribir por WhatsApp y
// retirar/reactivar. A un retirado no se le cobra: "Registrar pago" queda
// deshabilitado hasta reactivarlo (spec 14).
interface Props {
  alumno: Alumno;
  ocupado: boolean;
  onRegistrarPago?: () => void;
  onCambiarActivo: () => void;
}

const BOTON: CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 'var(--radius-md)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export function FichaAcciones({
  alumno,
  ocupado,
  onRegistrarPago,
  onCambiarActivo,
}: Readonly<Props>) {
  const retirado = !alumno.activo;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onRegistrarPago}
          disabled={retirado}
          title={retirado ? 'El alumno está retirado' : undefined}
          style={{
            ...BOTON,
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            cursor: retirado ? 'default' : 'pointer',
            opacity: retirado ? 0.45 : 1,
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
            ...BOTON,
            border: '1px solid var(--border-subtle)',
            background: 'color-mix(in srgb, var(--whatsapp) 14%, white)',
            color: 'var(--whatsapp)',
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

      <button
        type="button"
        onClick={onCambiarActivo}
        disabled={ocupado}
        style={{
          height: 42,
          borderRadius: 'var(--radius-md)',
          border: retirado
            ? '1px solid var(--border-subtle)'
            : '1px solid var(--error-soft)',
          background: retirado ? 'var(--surface-sunken)' : 'var(--surface-card)',
          color: retirado ? 'var(--brand-navy)' : 'var(--error-deep)',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: ocupado ? 'default' : 'pointer',
          opacity: ocupado ? 0.6 : 1,
        }}
      >
        {retirado ? 'Reactivar alumno' : 'Retirar alumno'}
      </button>
    </div>
  );
}
