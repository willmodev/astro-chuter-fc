import { useCallback, useSyncExternalStore } from 'react';

// Store mínimo sobre localStorage compartido entre consumidores: cambiar la
// preferencia en un lugar re-renderiza a todos los que la leen.
const suscriptores = new Set<() => void>();

function suscribir(fn: () => void): () => void {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
}

function leer<T extends string>(
  clave: string,
  valores: readonly T[],
  porDefecto: T,
): T {
  const guardado = window.localStorage.getItem(clave);
  return valores.find((v) => v === guardado) ?? porDefecto;
}

// El admin monta con client:only, así que nunca hay render en servidor y
// `useSyncExternalStore` no necesita getServerSnapshot. No agregar uno.
export function usePreferenciaLocal<T extends string>(
  clave: string,
  valores: readonly T[],
  porDefecto: T,
): [T, (valor: T) => void] {
  const valor = useSyncExternalStore(suscribir, () =>
    leer(clave, valores, porDefecto),
  );

  const setValor = useCallback(
    (nuevo: T): void => {
      window.localStorage.setItem(clave, nuevo);
      suscriptores.forEach((fn) => {
        fn();
      });
    },
    [clave],
  );

  return [valor, setValor];
}
