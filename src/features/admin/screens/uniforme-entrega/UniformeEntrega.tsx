import { AvisoMigracion } from '../../chrome/AvisoMigracion';
import { Icon } from '../../chrome/Icon';

// Registrar uniforme: en migración (spec 11). El modelo real (2 kits, abonos)
// llega en el spec 12; por ahora un aviso para no mezclar mock con datos reales.
interface Props {
  alumnoId: number;
  onVolver: () => void;
}

export function UniformeEntrega({ onVolver }: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <button
        type="button"
        onClick={onVolver}
        aria-label="Volver"
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-sunken)',
          color: 'var(--brand-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Icon name="arrow-left" size={19} />
      </button>
      <AvisoMigracion
        titulo="Uniformes en migración"
        detalle="El registro de entrega y pago de uniformes se está migrando al modelo real del club. Estará disponible muy pronto."
      />
    </div>
  );
}
