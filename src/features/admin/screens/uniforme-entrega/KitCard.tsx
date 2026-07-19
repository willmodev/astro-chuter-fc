import { useState } from 'react';

import { fmt } from '@/lib/format';
import { ESTADO_UNIFORME_META, type TipoKit } from '@/lib/domain/uniformes';

import { Badge } from '../../ui/Badge';
import { EtiquetaKit } from '../uniformes/EtiquetaKit';
import { HojaAbono } from './HojaAbono';
import { HojaEntrega } from './HojaEntrega';
import type { KitUniforme } from '../../data/types';

// Tarjeta de un kit: estado + detalle + saldo, con dos acciones (entrega y
// abono) que abren su hoja. Solo presenta y delega la escritura al hook.
interface Props {
  kit: KitUniforme;
  numeroOcupadoEn: (kit: TipoKit, numero: number) => boolean;
  onEntrega: (kit: TipoKit, numero: number, talla: string) => Promise<string | null>;
  onAnular: (kit: TipoKit) => Promise<string | null>;
  onAbono: (kit: TipoKit, montoCop: number) => Promise<string | null>;
}

export function KitCard({ kit, numeroOcupadoEn, onEntrega, onAnular, onAbono }: Readonly<Props>) {
  const [hoja, setHoja] = useState<'entrega' | 'abono' | null>(null);
  const meta = ESTADO_UNIFORME_META[kit.estado];
  const pagado = kit.saldo === 0;

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <EtiquetaKit kit={kit.kit} />
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          {pagado ? 'Pagado' : `Saldo ${fmt(kit.saldo)} de ${fmt(kit.precio)}`}
        </span>
        {kit.entregado && (
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            Nº {kit.numero ?? '—'}{kit.talla ? ` · Talla ${kit.talla}` : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Boton
          solido={!kit.entregado}
          label={kit.entregado ? 'Editar entrega' : 'Registrar entrega'}
          onClick={() => setHoja('entrega')}
        />
        <Boton
          solido={!pagado}
          disabled={pagado}
          label={pagado ? 'Pago completo' : 'Registrar abono'}
          onClick={() => setHoja('abono')}
        />
      </div>

      {hoja === 'entrega' && (
        <HojaEntrega
          kit={kit}
          numeroOcupadoEn={numeroOcupadoEn}
          onConfirmar={onEntrega}
          onAnular={onAnular}
          onClose={() => setHoja(null)}
        />
      )}
      {hoja === 'abono' && (
        <HojaAbono kit={kit} onAbono={onAbono} onClose={() => setHoja(null)} />
      )}
    </div>
  );
}

interface BotonProps {
  solido: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

function Boton({ solido, disabled = false, label, onClick }: Readonly<BotonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 46,
        padding: '0 12px',
        borderRadius: 'var(--radius-md)',
        border: solido ? 'none' : '1px solid var(--border-subtle)',
        background: solido ? 'var(--brand-navy)' : 'var(--surface-sunken)',
        color: solido ? '#fff' : 'var(--brand-navy)',
        fontSize: 13.5,
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}
