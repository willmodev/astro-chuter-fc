import { useState } from 'react';

import type { PagoDetalle } from '@/lib/db/repos/pagos';

import { Sheet } from '../../chrome/Sheet';

import { DetallePagoAnular } from './DetallePagoAnular';

// Confirmación antes de anular un cobro (spec 20): muestra el pago real que se
// va a deshacer y exige un motivo. La fila no se borra — queda con
// `anulado_en`, `anulado_por` y el motivo, y el mes vuelve a su estado derivado.
interface Props {
  nombreMes: string;
  pago: PagoDetalle;
  onConfirmar: (motivo: string) => Promise<string | null>;
  onClose: () => void;
}

const MOTIVO_MIN = 5;

export function HojaAnularPago({
  nombreMes,
  pago,
  onConfirmar,
  onClose,
}: Readonly<Props>) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sin motivo suficiente no se puede anular (el mínimo también va en la Action).
  const bloqueado = enviando || motivo.trim().length < MOTIVO_MIN;

  const confirmar = async (): Promise<void> => {
    setEnviando(true);
    setErrorMsg(null);
    const err = await onConfirmar(motivo.trim());
    setEnviando(false);
    if (err) setErrorMsg(err);
    else onClose();
  };

  return (
    <Sheet title={`¿Anular el pago de ${nombreMes}?`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <DetallePagoAnular pago={pago} />

        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.45,
            color: 'var(--text-body)',
          }}
        >
          El mes vuelve a quedar por cobrar y el monto sale del recaudo. Queda
          registrado quién lo anuló, cuándo y por qué.
        </p>

        <label style={{ display: 'grid', gap: 6 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            Motivo
          </span>
          <textarea
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
            }}
            rows={3}
            maxLength={200}
            placeholder="Ej: se cobró agosto por error, era julio"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-card)',
              color: 'var(--text-strong)',
              fontSize: 15,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.4,
              resize: 'none',
            }}
          />
        </label>

        {errorMsg && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--error)',
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </p>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            disabled={bloqueado}
            onClick={() => void confirmar()}
            style={{
              height: 48,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--error)',
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: bloqueado ? 'default' : 'pointer',
              opacity: bloqueado ? 0.6 : 1,
            }}
          >
            Anular pago
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={onClose}
            style={{
              height: 46,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-card)',
              color: 'var(--text-body)',
              fontSize: 14,
              fontWeight: 700,
              cursor: enviando ? 'default' : 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Sheet>
  );
}
