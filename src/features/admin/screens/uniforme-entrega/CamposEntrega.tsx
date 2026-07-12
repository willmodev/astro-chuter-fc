import { CampoTexto } from '../../ui/CampoTexto';
import { ToggleKit } from '../uniformes/ToggleKit';
import { PagoToggle } from './PagoToggle';
import type { EntregaValores } from './useUniformeEntrega';

// Campos de la entrega: kit + número + talla + estado de pago. Solo presenta.
interface Props {
  valores: EntregaValores;
  setCampo: <K extends keyof EntregaValores>(
    campo: K,
    valor: EntregaValores[K],
  ) => void;
}

export function CamposEntrega({ valores, setCampo }: Readonly<Props>) {
  return (
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
      <PagoToggle pago={valores.pago} onChange={(pago) => setCampo('pago', pago)} />
    </div>
  );
}
