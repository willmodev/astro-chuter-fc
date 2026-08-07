import { useState, type FormEvent } from 'react';
import { actions } from 'astro:actions';

import { formatearFechaISO, parseFechaNacimiento } from '@/lib/domain/alumnos';
import { categoriaDeFecha, rangoFechasAdmitidas } from '@/lib/domain/categoria';

export type Status = 'idle' | 'submitting' | 'success' | 'error';

// Límites del campo de fecha: derivados del catálogo, no escritos a mano.
const HOY = new Date();
const RANGO = rangoFechasAdmitidas(HOY);

export function useContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [childDate, setChildDate] = useState('');
  const fechaNino = parseFechaNacimiento(childDate);
  const catSugerida = fechaNino ? categoriaDeFecha(fechaNino, HOY) : null;
  const suggestedCat = catSugerida
    ? `${catSugerida.nombre} · ${catSugerida.etiqueta}`
    : null;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const { error } = await actions.enviarContacto(new FormData(form));

    if (error) {
      setStatus('error');
      return;
    }
    setStatus('success');
    form.reset();
    setChildDate('');
  }

  return {
    status,
    childDate,
    setChildDate,
    suggestedCat,
    fueraDeRango: fechaNino !== null && suggestedCat === null,
    minFecha: formatearFechaISO(RANGO.min),
    maxFecha: formatearFechaISO(RANGO.max),
    enviar,
  };
}
