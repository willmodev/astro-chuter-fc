import { IconButton } from '../../chrome/IconButton';
import { useMontosVisibles } from '../../hooks/useMontosVisibles';

// Ojo de mostrar/ocultar montos en la cabecera de Cartera. Escribe la
// misma preferencia que el interruptor de "Más".
export function BotonMontos() {
  const [visible, setVisible] = useMontosVisibles();

  return (
    <IconButton
      icon={visible ? 'eye' : 'eye-off'}
      label={visible ? 'Ocultar montos' : 'Mostrar montos'}
      onClick={() => {
        setVisible(!visible);
      }}
    />
  );
}
