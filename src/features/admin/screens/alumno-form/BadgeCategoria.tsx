import { parseFechaNacimiento } from '@/lib/domain/alumnos';
import { subDeFecha } from '@/lib/domain/categoria';

import { Badge } from '../../ui/Badge';

// Categoría automática (R1): al elegir la fecha muestra el badge SUB 4–16, o un
// aviso si la fecha está fuera de rango. Nada si la fecha aún está incompleta.
interface Props {
  fechaNacimiento: string;
}

export function BadgeCategoria({ fechaNacimiento }: Readonly<Props>) {
  const fecha = parseFechaNacimiento(fechaNacimiento);
  if (fecha === null) return null;
  const cat = subDeFecha(fecha);
  if (cat === null) {
    return (
      <span style={{ fontSize: 12.5, color: 'var(--error)', fontWeight: 600 }}>
        Fecha fuera de rango (SUB 4–16)
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
