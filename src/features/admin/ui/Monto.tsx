import { fmt, fmtShort } from '@/lib/format';

import { useMontosVisibles } from '../hooks/useMontosVisibles';

// Cifra en COP que respeta la preferencia de mostrar/ocultar montos.
// La máscara conserva el `$` y el ancho para que el layout no salte.
interface Props {
  valor: number;
  corto?: boolean;
}

const MASCARA = '$•••';

export function Monto({ valor, corto = false }: Readonly<Props>) {
  const [visible] = useMontosVisibles();

  if (!visible) {
    return (
      <span aria-label="Monto oculto" title="Monto oculto">
        {MASCARA}
      </span>
    );
  }

  return <>{corto ? fmtShort(valor) : fmt(valor)}</>;
}
