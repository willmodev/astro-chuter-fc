import type { ErroresAlumno } from '@/lib/domain/alumnos';

import { CampoTexto } from '../../ui/CampoTexto';
import { AutocompleteAcudiente } from './AutocompleteAcudiente';
import { BadgeCategoria } from './BadgeCategoria';
import type { FormValores } from './useAlumnoForm';

// Campos del form de alumno. Solo presenta: recibe valores, errores y setters
// desde el hook; el badge de categoría se deriva del año en vivo.
interface Props {
  valores: FormValores;
  errores: ErroresAlumno;
  sugerencias: string[];
  setCampo: (campo: keyof FormValores, valor: string) => void;
  onElegirAcudiente: (acu: string) => void;
}

export function CamposAlumno({
  valores,
  errores,
  sugerencias,
  setCampo,
  onElegirAcudiente,
}: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <CampoTexto
        label="Nombre completo"
        value={valores.name}
        onChange={(v) => setCampo('name', v)}
        placeholder="Nombre y apellidos"
        error={errores.name}
      />
      <CampoTexto
        label="Documento"
        value={valores.doc}
        onChange={(v) => setCampo('doc', v)}
        placeholder="Número de documento"
        inputMode="numeric"
        maxLength={12}
        error={errores.doc}
      />
      <div style={{ display: 'grid', gap: 8 }}>
        <CampoTexto
          label="Fecha de nacimiento"
          value={valores.fechaNacimiento}
          onChange={(v) => setCampo('fechaNacimiento', v)}
          type="date"
          error={errores.fechaNacimiento}
        />
        <BadgeCategoria fechaNacimiento={valores.fechaNacimiento} />
      </div>
      <AutocompleteAcudiente
        value={valores.acu}
        sugerencias={sugerencias}
        onChange={(v) => setCampo('acu', v)}
        onElegir={onElegirAcudiente}
        error={errores.acu}
      />
      <CampoTexto
        label="Celular"
        value={valores.phone}
        onChange={(v) => setCampo('phone', v)}
        placeholder="10 dígitos"
        inputMode="tel"
        maxLength={13}
        error={errores.phone}
      />
      <CampoTexto
        label="Dirección"
        value={valores.dir}
        onChange={(v) => setCampo('dir', v)}
        placeholder="Barrio, calle…"
        opcional
      />
    </div>
  );
}
