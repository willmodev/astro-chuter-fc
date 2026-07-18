import { AvisoMigracion } from '../../chrome/AvisoMigracion';

// Tab Uniforme: en migración (spec 11). El modelo real (2 kits AZUL/ORO con
// abonos) llega en el spec 12; por ahora un aviso para no mezclar el mock con
// los alumnos reales.
export function UniformeTab() {
  return (
    <AvisoMigracion
      titulo="Uniformes en migración"
      detalle="El control de uniformes se está migrando al modelo real del club. Estará disponible muy pronto."
    />
  );
}
