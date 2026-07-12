import { Icon } from '../../chrome/Icon';
import { AlumnoNoEncontrado } from '../ficha/AlumnoNoEncontrado';
import { CamposEntrega } from './CamposEntrega';
import { ResumenEntrega } from './ResumenEntrega';
import { useUniformeEntrega } from './useUniformeEntrega';

// Flujo Registrar/corregir entrega de uniforme (HU-5.3): kit + número + talla +
// pago, precio según R9 y advertencia no bloqueante de número repetido. Solo
// orquesta; reglas (precio, número ocupado, hermanos) viven en el dominio.
interface Props {
  alumnoId: number;
  onVolver: () => void;
  onGuardado: () => void;
}

export function UniformeEntrega({ alumnoId, onVolver, onGuardado }: Readonly<Props>) {
  const form = useUniformeEntrega({ alumnoId, onGuardado });

  if (!form.alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: 'block',
              fontSize: 16,
              color: 'var(--text-strong)',
              lineHeight: 1.2,
            }}
          >
            {form.alumno.name}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {form.alumno.cat} · {form.esCorreccion ? 'Corregir uniforme' : 'Registrar uniforme'}
          </span>
        </div>
      </div>

      <CamposEntrega valores={form.valores} setCampo={form.setCampo} />

      <ResumenEntrega
        precio={form.precio}
        repetido={form.repetido}
        valido={form.valido}
        esCorreccion={form.esCorreccion}
        onConfirmar={form.guardar}
      />
    </div>
  );
}
