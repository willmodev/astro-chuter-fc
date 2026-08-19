import { ItemCategoria } from './ItemCategoria';

import type { CategoriaAsignable } from './types';

// Selección múltiple de categorías del catálogo (spec 15): sin texto libre.
// Las que ya tiene otro entrenador activo dicen quién: en el alta van
// deshabilitadas y en la edición se pueden tomar (traspaso, spec 21).
interface Props {
  categorias: readonly CategoriaAsignable[];
  cargando: boolean;
  seleccionadas: readonly string[];
  onToggle: (etiqueta: string) => void;
  disabled?: boolean;
  permitirTraspaso?: boolean;
}

export function SelectorCategorias({
  categorias,
  cargando,
  seleccionadas,
  onToggle,
  disabled = false,
  permitirTraspaso = false,
}: Readonly<Props>) {
  if (cargando) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        Cargando categorías…
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {categorias.map((c) => (
        <ItemCategoria
          key={c.etiqueta}
          categoria={c}
          activa={seleccionadas.includes(c.etiqueta)}
          bloqueada={c.ocupadaPor !== null && !permitirTraspaso}
          disabled={disabled}
          permitirTraspaso={permitirTraspaso}
          onToggle={() => {
            onToggle(c.etiqueta);
          }}
        />
      ))}
    </div>
  );
}
