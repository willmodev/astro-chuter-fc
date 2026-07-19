import { useState } from 'react';

import { fmt } from '@/lib/format';
import type { TipoKit } from '@/lib/domain/uniformes';

import { CampoTexto } from '../../ui/CampoTexto';
import type { KitUniforme } from '../../data/types';

// Hoja de abono (spec 12): registra un pago parcial o total del kit. Muestra
// precio y saldo; "Pagar el saldo" precarga el monto restante. El monto se acota
// a [0, precio] en el servidor. Solo presenta; escribe vía el hook.
interface Props {
  kit: KitUniforme;
  onAbono: (kit: TipoKit, montoCop: number) => Promise<string | null>;
  onClose: () => void;
}

export function HojaAbono({ kit, onAbono, onClose }: Readonly<Props>) {
  const [montoTxt, setMontoTxt] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const monto = Number(montoTxt);
  const valido = Number.isInteger(monto) && monto > 0 && monto <= kit.saldo;

  const registrar = async (): Promise<void> => {
    setEnviando(true);
    setErrorMsg(null);
    const err = await onAbono(kit.kit, monto);
    setEnviando(false);
    if (err) setErrorMsg(err);
    else onClose();
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Precio</span>
        <strong style={{ color: 'var(--text-strong)' }}>{fmt(kit.precio)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Saldo</span>
        <strong style={{ color: 'var(--text-strong)' }}>{fmt(kit.saldo)}</strong>
      </div>

      <CampoTexto
        label="Monto a abonar"
        value={montoTxt}
        onChange={(v) => setMontoTxt(v.replace(/\D/g, ''))}
        placeholder="Ej. 50000"
        inputMode="numeric"
        maxLength={7}
      />
      <button
        type="button"
        onClick={() => setMontoTxt(String(kit.saldo))}
        style={{
          justifySelf: 'start',
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--brand-blue)',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Pagar el saldo ({fmt(kit.saldo)})
      </button>

      {errorMsg && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', fontWeight: 600 }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 44,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            color: 'var(--text-strong)',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!valido || enviando}
          onClick={() => void registrar()}
          style={{
            height: 44,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: !valido || enviando ? 'default' : 'pointer',
            opacity: !valido || enviando ? 0.55 : 1,
          }}
        >
          Registrar
        </button>
      </div>
    </div>
  );
}
