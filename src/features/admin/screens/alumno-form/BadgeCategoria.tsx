import { subDeAnio } from '@/lib/domain/categoria';

import { Badge } from '../../ui/Badge';

// Categoría automática (R1): al digitar el año muestra el badge SUB 4–16, o un
// aviso si el año está fuera de rango. Nada si el año aún está incompleto.
interface Props {
  anio: number;
}

export function BadgeCategoria({ anio }: Readonly<Props>) {
  if (!Number.isInteger(anio) || anio < 1000) return null;
  const cat = subDeAnio(anio);
  if (cat === null) {
    return (
      <span style={{ fontSize: 12.5, color: 'var(--error)', fontWeight: 600 }}>
        Año fuera de rango (SUB 4–16)
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
        Categoría
      </span>
      <Badge tone="navy" subtle={false}>
        {cat}
      </Badge>
    </span>
  );
}
