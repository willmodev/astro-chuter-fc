import { Badge } from '../../ui/Badge';

// Aviso de dato faltante (spec 15): sin fecha de nacimiento la categoría se
// calcula por el año, así que puede quedar una categoría por encima hasta que
// el alumno cumpla años. Se muestra junto a la categoría en la ficha.
export function BadgeFaltaFecha() {
  return (
    <Badge
      tone="partial"
      style={{ height: 'auto', padding: '3px 9px', whiteSpace: 'normal' }}
    >
      Falta fecha de nacimiento — categoría calculada por año
    </Badge>
  );
}
