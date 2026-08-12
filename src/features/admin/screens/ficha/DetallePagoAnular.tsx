import { fmt } from '@/lib/format';
import type { PagoDetalle } from '@/lib/db/repos/pagos';

import { FilaDato } from './FilaDato';

// Datos del pago que se va a anular. El monto va siempre en claro (ignora la
// preferencia de ocultar montos): es lo que permite confirmar que se anula el
// pago correcto. Los pagos de la carga inicial no tienen fecha, método ni autor
// y se anuncian como tal en vez de mostrar campos vacíos (spec 20).
interface Props {
  pago: PagoDetalle;
}

function fechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function DetallePagoAnular({ pago }: Readonly<Props>) {
  const deCargaInicial = pago.pagadoEn === null && pago.metodo === null;

  return (
    <div>
      <FilaDato label="Monto">{fmt(pago.montoCop)}</FilaDato>
      {deCargaInicial ? (
        <FilaDato label="Origen">Carga inicial del Excel</FilaDato>
      ) : (
        <>
          <FilaDato label="Fecha">
            {pago.pagadoEn ? fechaLarga(pago.pagadoEn) : 'Sin fecha'}
          </FilaDato>
          <FilaDato label="Método">
            <span style={{ textTransform: 'capitalize' }}>
              {pago.metodo ?? 'Sin método'}
            </span>
          </FilaDato>
          <FilaDato label="Registró">
            {pago.registradoPorNombre ?? 'Sin autor'}
          </FilaDato>
        </>
      )}
    </div>
  );
}
