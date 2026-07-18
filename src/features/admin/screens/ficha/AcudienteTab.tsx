import { Card } from '../../ui/Card';
import { FilaDato } from './FilaDato';
import type { AlumnoPlantel } from '../../data/types';

// Tab Acudiente: datos de contacto y de inscripción del alumno. Usa el
// subconjunto sin dinero (`AlumnoPlantel`) → sirve al admin y al entrenador.
interface Props {
  alumno: AlumnoPlantel;
}

export function AcudienteTab({ alumno }: Readonly<Props>) {
  return (
    <Card>
      <div style={{ marginTop: -11, marginBottom: -12 }}>
        <FilaDato label="Acudiente">{alumno.acu}</FilaDato>
        <FilaDato label="Celular">{alumno.phone}</FilaDato>
        <FilaDato label="Dirección">{alumno.dir}</FilaDato>
        <FilaDato label="Documento">{alumno.doc}</FilaDato>
        <FilaDato label="Año de nacimiento">{alumno.anio}</FilaDato>
        <FilaDato label="Ingreso">{alumno.desde}</FilaDato>
        <FilaDato label="Hermanos en el club">{alumno.hermanos}</FilaDato>
      </div>
    </Card>
  );
}
