import { useState } from 'react';

import { Icon } from '../../chrome/Icon';
import { AlumnoNoEncontrado } from '../ficha/AlumnoNoEncontrado';
import { AccionesUniforme } from './AccionesUniforme';
import { HojaEntrega } from './HojaEntrega';
import { TarjetaEstado } from './TarjetaEstado';
import { useUniformeEntrega } from './useUniformeEntrega';

// Pantalla de uniforme (spec 08): pago y entrega como registros independientes
// (modelo de 4 estados). Solo orquesta; reglas (estado, precio, número ocupado,
// hermanos) viven en el dominio y las escrituras en el store.
interface Props {
  alumnoId: number;
  onVolver: () => void;
}

export function UniformeEntrega({ alumnoId, onVolver }: Readonly<Props>) {
  const form = useUniformeEntrega({ alumnoId });
  const [hojaAbierta, setHojaAbierta] = useState(false);

  if (!form.alumno) {
    return <AlumnoNoEncontrado onVolver={onVolver} />;
  }

  const confirmarEntrega = (): void => {
    form.guardarEntrega();
    setHojaAbierta(false);
  };
  const anularEntrega = (): void => {
    form.anularEntrega();
    setHojaAbierta(false);
  };

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver"
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="arrow-left" size={19} />
        </button>
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: 'block',
              fontSize: 16,
              color: 'var(--text-strong)',
              lineHeight: 1.2,
            }}
          >
            {form.alumno.name}
          </strong>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            {form.alumno.cat} · Uniforme
          </span>
        </div>
      </div>

      <TarjetaEstado estado={form.estado} entregado={form.entregado} pagado={form.pagado} />

      <AccionesUniforme
        pagado={form.pagado}
        entregado={form.entregado}
        precio={form.precio}
        detalleEntrega={form.detalleEntrega}
        onTogglePago={form.togglePago}
        onAbrirEntrega={() => setHojaAbierta(true)}
      />

      {hojaAbierta && (
        <HojaEntrega
          entregado={form.entregado}
          valores={form.valores}
          setCampo={form.setCampo}
          valido={form.valido}
          repetido={form.repetido}
          onConfirmar={confirmarEntrega}
          onAnular={anularEntrega}
          onClose={() => setHojaAbierta(false)}
        />
      )}
    </div>
  );
}
