import { waTo } from '@/lib/whatsapp';

import { Icon } from '../../chrome/Icon';

import type { CSSProperties } from 'react';
import type { Alumno } from '../../data/types';

// Acciones de la ficha (solo admin): escribir por WhatsApp y retirar/reactivar.
// Cobrar no vive aquí: la entrada única es tocar el mes en la tab Pagos, que
// además preselecciona ese mes. A un retirado no se le cobra: las celdas de la
// tira quedan apagadas hasta reactivarlo (spec 14).
interface Props {
  alumno: Alumno;
  ocupado: boolean;
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
  onCambiarActivo,
}: Readonly<Props>) {
  const retirado = !alumno.activo;

  return (
    <div style={{ display: 'flex', gap: 10 }}>
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

      <button
        type="button"
        onClick={onCambiarActivo}
        disabled={ocupado}
        style={{
          ...BOTON,
          fontWeight: 700,
          border: retirado
            ? '1px solid var(--border-subtle)'
            : '1px solid var(--error-soft)',
          background: retirado
            ? 'var(--surface-sunken)'
            : 'var(--surface-card)',
          color: retirado ? 'var(--brand-navy)' : 'var(--error-deep)',
          cursor: ocupado ? 'default' : 'pointer',
          opacity: ocupado ? 0.6 : 1,
        }}
      >
        {retirado ? 'Reactivar alumno' : 'Retirar alumno'}
      </button>
    </div>
  );
}
