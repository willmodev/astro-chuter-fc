import { AlumnoForm } from './screens/alumno-form/AlumnoForm';
import { EquipoScreen } from './screens/equipo/EquipoScreen';
import { Entrenamientos } from './screens/entrenamientos/Entrenamientos';
import { Ficha } from './screens/ficha/Ficha';
import { Pago } from './screens/pago/Pago';
import { UniformeEntrega } from './screens/uniforme-entrega/UniformeEntrega';
import { Uniformes } from './screens/uniformes/Uniformes';

import type { RutaAdmin } from './router/types';

// Vistas de detalle (las que se abren desde una tab, no desde la tab bar).
// Separadas de VistaAdmin para que ningún despachador ramifique de más.
interface Props {
  ruta: RutaAdmin;
  navegar: (ruta: RutaAdmin) => void;
  volver: () => void;
}

export function VistaDetalle({ ruta, navegar, volver }: Readonly<Props>) {
  switch (ruta.vista) {
    case 'equipo':
      return (
        <EquipoScreen
          onBack={() => {
            navegar({ vista: 'mas' });
          }}
        />
      );

    case 'ficha':
      return (
        <Ficha
          alumnoId={ruta.alumnoId}
          onVolver={() => {
            navegar({ vista: 'alumnos' });
          }}
          onEditar={() => {
            navegar({ vista: 'alumnoEditar', alumnoId: ruta.alumnoId });
          }}
          onRegistrarPago={(mes) => {
            navegar({ vista: 'pago', alumnoId: ruta.alumnoId, mes });
          }}
          onRegistrarUniforme={() => {
            navegar({ vista: 'uniformeEntrega', alumnoId: ruta.alumnoId });
          }}
        />
      );

    case 'pago':
      return (
        <Pago
          alumnoId={ruta.alumnoId}
          mes={ruta.mes}
          onVolver={() => {
            navegar({ vista: 'ficha', alumnoId: ruta.alumnoId });
          }}
        />
      );

    case 'alumnoNuevo':
      return (
        <AlumnoForm
          modo="nuevo"
          onVolver={() => {
            navegar({ vista: 'alumnos' });
          }}
          onGuardado={(alumnoId) => {
            navegar({ vista: 'ficha', alumnoId });
          }}
        />
      );

    case 'alumnoEditar':
      return (
        <AlumnoForm
          modo="editar"
          alumnoId={ruta.alumnoId}
          onVolver={() => {
            navegar({ vista: 'ficha', alumnoId: ruta.alumnoId });
          }}
          onGuardado={(alumnoId) => {
            navegar({ vista: 'ficha', alumnoId });
          }}
        />
      );

    case 'uniformes':
      return (
        <Uniformes
          onEntrega={(alumnoId) => {
            navegar({ vista: 'uniformeEntrega', alumnoId });
          }}
        />
      );

    case 'uniformeEntrega':
      return <UniformeEntrega alumnoId={ruta.alumnoId} onVolver={volver} />;

    case 'entrenamientos':
      return (
        <Entrenamientos
          onBack={() => {
            navegar({ vista: 'mas' });
          }}
        />
      );

    default:
      return null;
  }
}
