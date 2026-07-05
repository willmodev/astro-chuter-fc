import { Card } from '../../ui/Card';
import { FilaDato } from './FilaDato';
import type { Alumno } from '../../data/types';

// Tab Acudiente: datos de contacto y de inscripción del alumno.
interface Props {
  alumno: Alumno;
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
