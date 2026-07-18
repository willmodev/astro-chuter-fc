import { EstadoCarga } from '../../chrome/EstadoCarga';
import { Icon } from '../../chrome/Icon';
import { AvisoMigracion } from '../../chrome/AvisoMigracion';
import { useAlumnosPlantel } from '../../hooks/useAlumnosPlantel';
import { Avatar } from '../../ui/Avatar';
import { AcudienteTab } from '../ficha/AcudienteTab';
import { AlumnoNoEncontrado } from '../ficha/AlumnoNoEncontrado';

// Ficha del entrenador (solo lectura): identidad + acudiente, SIN un solo dato
// de dinero (se sirve de `alumnos.listar` filtrada → AlumnoPlantel). El tab de
// uniforme muestra el aviso de migración (spec 11).
interface Props {
  alumnoId: number;
  onVolver: () => void;
}

export function FichaPlantel({ alumnoId, onVolver }: Readonly<Props>) {
  const { alumnos, estado, recargar } = useAlumnosPlantel();

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }
  const alumno = alumnos.find((a) => a.id === alumnoId);
  if (!alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver al plantel"
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
        <Avatar name={alumno.name} size={44} />
        <span style={{ minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 16, color: 'var(--text-strong)', lineHeight: 1.2 }}>
            {alumno.name}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {alumno.cat} · {alumno.desde}
          </span>
        </span>
      </div>

      <AcudienteTab alumno={alumno} />

      <AvisoMigracion
        titulo="Uniformes en migración"
        detalle="La gestión de uniformes se está migrando a los datos reales del club. Estará disponible muy pronto."
      />
    </div>
  );
}
