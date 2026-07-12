import { fmt } from '@/lib/format';

import { Icon, type IconName } from '../../chrome/Icon';

// Acciones del uniforme (spec 08): precio R9 + los dos ejes como una fila de dos
// botones. Sólido = acción por hacer (registrar); contorno = ya hecho (deshacer/
// editar). El pago es un toggle instantáneo; la entrega abre la hoja de captura.
interface Props {
  pagado: boolean;
  entregado: boolean;
  precio: number;
  detalleEntrega: string | null;
  onTogglePago: () => void;
  onAbrirEntrega: () => void;
}

export function AccionesUniforme({
  pagado,
  entregado,
  precio,
  detalleEntrega,
  onTogglePago,
  onAbrirEntrega,
}: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          Precio del uniforme
        </span>
        <strong style={{ fontSize: 20, color: 'var(--text-strong)' }}>{fmt(precio)}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <BotonEje
          icono="wallet"
          hecho={pagado}
          labelHacer="Registrar pago"
          labelDeshacer="Anular pago"
          onClick={onTogglePago}
        />
        <BotonEje
          icono="shirt"
          hecho={entregado}
          labelHacer="Registrar entrega"
          labelDeshacer="Editar entrega"
          onClick={onAbrirEntrega}
        />
      </div>

      {detalleEntrega && (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
          {detalleEntrega}
        </span>
      )}
    </div>
  );
}

interface BotonProps {
  icono: IconName;
  hecho: boolean;
  labelHacer: string;
  labelDeshacer: string;
  onClick: () => void;
}

function BotonEje({ icono, hecho, labelHacer, labelDeshacer, onClick }: Readonly<BotonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 50,
        padding: '0 12px',
        borderRadius: 'var(--radius-md)',
        border: hecho ? '1px solid var(--border-subtle)' : 'none',
        background: hecho ? 'var(--surface-sunken)' : 'var(--brand-navy)',
        color: hecho ? 'var(--brand-navy)' : '#fff',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        lineHeight: 1.15,
        textAlign: 'center',
      }}
    >
      <Icon name={icono} size={17} />
      {hecho ? labelDeshacer : labelHacer}
    </button>
  );
}
