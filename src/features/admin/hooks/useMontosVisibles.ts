import { useCallback } from 'react';

import { usePreferenciaLocal } from './usePreferenciaLocal';

const KEY = 'chuter.admin.montosVisibles';
const VALORES = ['si', 'no'] as const;

// Mostrar/ocultar montos (HU-7.2). Es comodidad visual para revisar la
// cartera con alguien al lado, NO un control de seguridad.
export function useMontosVisibles(): [boolean, (visible: boolean) => void] {
  const [valor, setValor] = usePreferenciaLocal(KEY, VALORES, 'si');

  const setVisible = useCallback(
    (visible: boolean): void => {
      setValor(visible ? 'si' : 'no');
    },
    [setValor],
  );

  return [valor === 'si', setVisible];
}
