import { Icon } from '../../chrome/Icon';
import { AlumnoNoEncontrado } from '../ficha/AlumnoNoEncontrado';
import { AvisoHermano } from './AvisoHermano';
import { CamposAlumno } from './CamposAlumno';
import { useAlumnoForm } from './useAlumnoForm';

// Form de alumno (HU-2.4, HU-2.5): inscribir o editar. Solo orquesta —
// validación, categoría automática y detección de hermanos viven en el dominio
// (vía el hook); el store deriva cuota/states/uniforme al guardar.
interface Props {
  modo: 'nuevo' | 'editar';
  alumnoId?: number;
  onVolver: () => void;
  onGuardado: (id: number) => void;
}

export function AlumnoForm({ modo, alumnoId, onVolver, onGuardado }: Readonly<Props>) {
  const form = useAlumnoForm({ modo, alumnoId, onGuardado });

  if (!form.existe) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  const cta = modo === 'nuevo' ? 'Inscribir alumno' : 'Guardar cambios';

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
        <strong style={{ fontSize: 16, color: 'var(--text-strong)' }}>
          {modo === 'nuevo' ? 'Inscribir alumno' : 'Editar alumno'}
        </strong>
      </div>

      <CamposAlumno
        valores={form.valores}
        errores={form.errores}
        sugerencias={form.sugerencias}
        setCampo={form.setCampo}
        onElegirAcudiente={(acu) => form.setCampo('acu', acu)}
      />

      {form.hermano && <AvisoHermano />}

      <button
        type="button"
        onClick={form.guardar}
        style={{
          height: 48,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--brand-navy)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {cta}
      </button>
    </div>
  );
}
