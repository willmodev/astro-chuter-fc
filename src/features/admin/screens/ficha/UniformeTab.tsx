import { Card } from '../../ui/Card';
import { FilaDato } from './FilaDato';
import type { Alumno } from '../../data/types';

// Tab Uniforme: kit/número/talla si fue entregado; si está pendiente,
// CTA "Registrar entrega" (placeholder hasta el spec de Uniformes).
interface Props {
  alumno: Alumno;
  onRegistrarEntrega: () => void;
}

export function UniformeTab({ alumno, onRegistrarEntrega }: Readonly<Props>) {
  if (alumno.uniforme === 'pendiente') {
    return (
      <Card>
        <div style={{ display: 'grid', gap: 12, justifyItems: 'center', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            Uniforme pendiente de entrega.
          </p>
          <button
            type="button"
            onClick={onRegistrarEntrega}
            style={{
              height: 44,
              padding: '0 22px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--brand-navy)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Registrar entrega
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginTop: -11, marginBottom: -12 }}>
        <FilaDato label="Kit">{alumno.tipoKit ?? '—'}</FilaDato>
        <FilaDato label="Número">{alumno.numero ?? '—'}</FilaDato>
        <FilaDato label="Talla">{alumno.talla}</FilaDato>
      </div>
    </Card>
  );
}
