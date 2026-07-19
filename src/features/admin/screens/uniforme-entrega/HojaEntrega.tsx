import { useState } from 'react';

import type { TipoKit } from '@/lib/domain/uniformes';

import { Icon } from '../../chrome/Icon';
import { Sheet } from '../../chrome/Sheet';
import { CampoTexto } from '../../ui/CampoTexto';
import { EtiquetaKit } from '../uniformes/EtiquetaKit';
import type { KitUniforme } from '../../data/types';

// Hoja de captura de la entrega (spec 12): número + talla del kit (implícito por
// la tarjeta) con advertencia no bloqueante de número repetido. Confirma; si ya
// estaba entregado, permite anular. Reglas en dominio/hook.
interface Props {
  kit: KitUniforme;
  numeroOcupadoEn: (kit: TipoKit, numero: number) => boolean;
  onConfirmar: (kit: TipoKit, numero: number, talla: string) => Promise<string | null>;
  onAnular: (kit: TipoKit) => Promise<string | null>;
  onClose: () => void;
}

export function HojaEntrega({ kit, numeroOcupadoEn, onConfirmar, onAnular, onClose }: Readonly<Props>) {
  const [numeroTxt, setNumeroTxt] = useState(kit.numero != null ? String(kit.numero) : '');
  const [talla, setTalla] = useState(kit.talla);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numero = Number(numeroTxt);
  const numeroValido = Number.isInteger(numero) && numero > 0;
  const valido = numeroValido && talla.trim() !== '';
  const repetido = numeroValido && numeroOcupadoEn(kit.kit, numero);

  const correr = async (accion: () => Promise<string | null>): Promise<void> => {
    setEnviando(true);
    setErrorMsg(null);
    const err = await accion();
    setEnviando(false);
    if (err) setErrorMsg(err);
    else onClose();
  };

  return (
    <Sheet title={`Entrega · Kit ${kit.kit === 'AZUL' ? 'Azul' : 'Oro'}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <EtiquetaKit kit={kit.kit} />
        <CampoTexto
          label="Número"
          value={numeroTxt}
          onChange={(v) => setNumeroTxt(v.replace(/\D/g, ''))}
          placeholder="Ej. 10"
          inputMode="numeric"
          maxLength={3}
        />
        <CampoTexto
          label="Talla"
          value={talla}
          onChange={setTalla}
          placeholder="Ej. 12"
          maxLength={10}
        />

        {repetido && <AvisoRepetido />}
        {errorMsg && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', fontWeight: 600 }}>
            {errorMsg}
          </p>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            disabled={!valido || enviando}
            onClick={() => void correr(() => onConfirmar(kit.kit, numero, talla.trim()))}
            style={{
              height: 48,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--brand-navy)',
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: !valido || enviando ? 'default' : 'pointer',
              opacity: !valido || enviando ? 0.55 : 1,
            }}
          >
            {kit.entregado ? 'Guardar cambios' : 'Registrar entrega'}
          </button>
          {kit.entregado && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => void correr(() => onAnular(kit.kit))}
              style={{
                height: 46,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--error-soft)',
                background: 'var(--surface-card)',
                color: 'var(--error-deep)',
                fontSize: 14,
                fontWeight: 700,
                cursor: enviando ? 'default' : 'pointer',
              }}
            >
              Anular entrega
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function AvisoRepetido() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--warning-soft)',
        border: '1px solid color-mix(in srgb, var(--warning) 40%, white)',
      }}
    >
      <span style={{ color: '#946200', flexShrink: 0, marginTop: 1 }}>
        <Icon name="triangle-alert" size={18} />
      </span>
      <span style={{ fontSize: 12.5, color: '#946200', lineHeight: 1.35 }}>
        Ese número ya está usado en este kit. Podés guardar igual, pero revisá que
        no quede repetido.
      </span>
    </div>
  );
}
