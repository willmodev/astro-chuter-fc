import { Sheet } from '../../chrome/Sheet';
import { Icon } from '../../chrome/Icon';
import { CampoTexto } from '../../ui/CampoTexto';
import { ToggleKit } from '../uniformes/ToggleKit';
import type { EntregaValores } from './useUniformeEntrega';

// Hoja de captura de la entrega (spec 08): kit + número + talla con advertencia
// no bloqueante de número repetido. Confirma la entrega; si ya estaba entregado,
// permite anularla. Solo presenta; las reglas viven en el hook/dominio.
interface Props {
  entregado: boolean;
  valores: EntregaValores;
  setCampo: <K extends keyof EntregaValores>(campo: K, valor: EntregaValores[K]) => void;
  valido: boolean;
  repetido: boolean;
  onConfirmar: () => void;
  onAnular: () => void;
  onClose: () => void;
}

export function HojaEntrega({
  entregado,
  valores,
  setCampo,
  valido,
  repetido,
  onConfirmar,
  onAnular,
  onClose,
}: Readonly<Props>) {
  return (
    <Sheet title="Entrega del uniforme" onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <span className="eyebrow">Kit</span>
          <ToggleKit kit={valores.kit} onChange={(kit) => setCampo('kit', kit)} />
        </div>
        <CampoTexto
          label="Número"
          value={valores.numero}
          onChange={(v) => setCampo('numero', v.replace(/\D/g, ''))}
          placeholder="Ej. 10"
          inputMode="numeric"
          maxLength={2}
        />
        <CampoTexto
          label="Talla"
          value={valores.talla}
          onChange={(v) => setCampo('talla', v)}
          placeholder="Ej. 10, S, M…"
        />
        {repetido && <AvisoRepetido />}

        <button
          type="button"
          onClick={onConfirmar}
          disabled={!valido}
          style={{
            height: 48,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: valido ? 'var(--brand-navy)' : 'var(--neutral-300)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: valido ? 'pointer' : 'not-allowed',
          }}
        >
          {entregado ? 'Guardar cambios' : 'Registrar entrega'}
        </button>

        {entregado && (
          <button
            type="button"
            onClick={onAnular}
            style={{
              height: 46,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--error-soft)',
              background: 'var(--surface-card)',
              color: 'var(--error-deep)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Anular entrega
          </button>
        )}
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
