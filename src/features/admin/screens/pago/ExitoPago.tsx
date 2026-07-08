import { fmt } from '@/lib/format';
import { waTo } from '@/lib/whatsapp';

import { Icon } from '../../chrome/Icon';
import { MONTHS_LONG } from '../../data/mock';
import type { Alumno } from '../../data/types';

// Pantalla de éxito tras `registrarPago`: recibo por WhatsApp al acudiente
// con mensaje precargado (alumno, meses, total) y vuelta a la Ficha.
interface Props {
  alumno: Alumno;
  meses: number[];
  total: number;
  onVolver: () => void;
}

export function ExitoPago({ alumno, meses, total, onVolver }: Readonly<Props>) {
  const nombresMeses = [...meses]
    .sort((a, b) => a - b)
    .map((i) => MONTHS_LONG[i])
    .join(', ');
  const mensaje = `Hola ${alumno.acu}, te confirmamos el pago de ${alumno.name} — ${nombresMeses} (${fmt(total)}). ¡Gracias! Chuter FC.`;

  return (
    <output
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 320,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center', maxWidth: 320, width: '100%' }}>
        <span style={{ color: 'var(--success)' }}>
          <Icon name="circle-check" size={40} />
        </span>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>
          Pago registrado
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {nombresMeses} · {fmt(total)}
        </p>
        <a
          href={waTo(alumno.phone, mensaje)}
          target="_blank"
          rel="noreferrer"
          style={{
            marginTop: 8,
            height: 46,
            width: '100%',
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
          <Icon name="message-circle" size={18} /> Enviar recibo por WhatsApp
        </a>
        <button
          type="button"
          onClick={onVolver}
          style={{
            height: 44,
            width: '100%',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Volver a la ficha
        </button>
      </div>
    </output>
  );
}
