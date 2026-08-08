import { ESTADO_UNIFORME_META } from '@/lib/domain/uniformes';
import type { FilaKit } from '@/lib/db/repos/uniformes';

import { Badge } from '../../ui/Badge';

import { EtiquetaKit } from './EtiquetaKit';

// Fila unificada de la pantalla Uniformes: número (o —), nombre, categoría,
// kit, talla, «Abonado» si el pago es parcial, y badge de estado. Sin montos.
interface Props {
  fila: FilaKit;
  duplicado?: boolean;
  onAbrir: (alumnoId: number) => void;
}

export function FilaKitItem({
  fila,
  duplicado = false,
  onAbrir,
}: Readonly<Props>) {
  const meta = ESTADO_UNIFORME_META[fila.estado];
  const abonoParcial = fila.abonadoCop > 0 && fila.abonadoCop < fila.precio;

  return (
    <button
      type="button"
      onClick={() => {
        onAbrir(fila.alumnoId);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 14px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 800,
          background: duplicado
            ? 'var(--warning-soft)'
            : 'var(--surface-sunken)',
          color: duplicado ? '#946200' : 'var(--brand-navy)',
          border: duplicado ? '1px solid var(--warning)' : 'none',
        }}
      >
        {fila.numero ?? '—'}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-strong)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fila.nombre}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {fila.cat} · <EtiquetaKit kit={fila.kit} />
          {fila.talla !== '' && <>· Talla {fila.talla}</>}
          {abonoParcial && <>· Abonado</>}
        </span>
      </span>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </button>
  );
}
