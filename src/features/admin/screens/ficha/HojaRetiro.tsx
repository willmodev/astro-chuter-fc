import { useState } from 'react';

import { Sheet } from '../../chrome/Sheet';

// Confirmación antes de retirar (reactivar no la pide: es benigno).
// No borra nada — el historial queda y el retiro se puede revertir (spec 14).
interface Props {
  nombre: string;
  onConfirmar: () => Promise<string | null>;
  onClose: () => void;
}

export function HojaRetiro({ nombre, onConfirmar, onClose }: Readonly<Props>) {
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const confirmar = async (): Promise<void> => {
    setEnviando(true);
    setErrorMsg(null);
    const err = await onConfirmar();
    setEnviando(false);
    if (err) setErrorMsg(err);
    else onClose();
  };

  return (
    <Sheet title={`¿Retirar a ${nombre}?`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.45,
            color: 'var(--text-body)',
          }}
        >
          Sale de la lista de alumnos activos y de la cartera: deja de generar
          mora. Su historial de pagos y uniformes se conserva y podés
          reactivarlo cuando quieras.
        </p>

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
            disabled={enviando}
            onClick={() => void confirmar()}
            style={{
              height: 48,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--error)',
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: enviando ? 'default' : 'pointer',
              opacity: enviando ? 0.6 : 1,
            }}
          >
            Retirar alumno
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
