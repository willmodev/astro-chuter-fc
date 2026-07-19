import { EstadoCarga } from '../../chrome/EstadoCarga';
import { Icon } from '../../chrome/Icon';
import { AlumnoNoEncontrado } from '../ficha/AlumnoNoEncontrado';
import { KitCard } from './KitCard';
import { useUniformeAlumno } from './useUniformeAlumno';

// Pantalla de gestión del uniforme (spec 12): los DOS kits del alumno (AZUL/ORO),
// cada uno con su entrega y su abono. Solo orquesta; reglas en dominio, escritura
// en Actions vía el hook.
interface Props {
  alumnoId: number;
  onVolver: () => void;
}

export function UniformeEntrega({ alumnoId, onVolver }: Readonly<Props>) {
  const data = useUniformeAlumno(alumnoId);

  if (data.estado !== 'listo') {
    return <EstadoCarga estado={data.estado} onReintentar={data.recargar} />;
  }
  if (!data.alumno) {
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
            style={{ display: 'block', fontSize: 16, color: 'var(--text-strong)', lineHeight: 1.2 }}
          >
            {data.alumno.nombre}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {data.alumno.cat} · Uniforme
          </span>
        </div>
      </div>

      {data.alumno.kits.map((kit) => (
        <KitCard
          key={kit.kit}
          kit={kit}
          numeroOcupadoEn={data.numeroOcupadoEn}
          onEntrega={data.registrarEntrega}
          onAnular={data.anularEntrega}
          onAbono={data.registrarAbono}
        />
      ))}
    </div>
  );
}
