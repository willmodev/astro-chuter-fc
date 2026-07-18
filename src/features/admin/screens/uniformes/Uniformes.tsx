import { AvisoMigracion } from '../../chrome/AvisoMigracion';

// Pantalla Uniformes: en migración (spec 11). El modelo real son 2 kits por
// alumno (AZUL/ORO) con abonos parciales — llega en el spec 12. Mientras tanto
// mostramos un aviso para no mezclar el mock viejo con los alumnos reales.
interface Props {
  onEntrega: (alumnoId: number) => void;
}

export function Uniformes(_props: Readonly<Props>) {
  return (
    <div style={{ padding: '14px 16px 24px' }}>
      <AvisoMigracion
        titulo="Uniformes en migración"
        detalle="Estamos migrando el control de uniformes al modelo real del club (dos kits por alumno con abonos). Estará disponible muy pronto."
      />
    </div>
  );
}
