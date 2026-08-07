import { useState, type FormEvent } from 'react';
import { actions } from 'astro:actions';

import { CONTACT } from '@/lib/site';
import { WA_FAB } from '@/lib/whatsapp';
import { formatearFechaISO, parseFechaNacimiento } from '@/lib/domain/alumnos';
import { categoriaDeFecha, rangoFechasAdmitidas } from '@/lib/domain/categoria';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputClass =
  'w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20';

// Límites del campo de fecha: derivados del catálogo, no escritos a mano.
const HOY = new Date();
const RANGO = rangoFechasAdmitidas(HOY);

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [childDate, setChildDate] = useState('');
  const fechaNino = parseFechaNacimiento(childDate);
  const catSugerida = fechaNino ? categoriaDeFecha(fechaNino, HOY) : null;
  const suggestedCat = catSugerida
    ? `${catSugerida.nombre} · ${catSugerida.etiqueta}`
    : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

  if (status === 'success') {
    return (
      <div className="bg-success/10 flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div className="bg-success/20 flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            aria-hidden="true"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-800">
            ¡Mensaje enviado!
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Te contactaremos pronto. También podés escribirnos directo por
            WhatsApp al{' '}
            <a
              href={WA_FAB}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-navy font-medium underline-offset-2 hover:underline"
            >
              {CONTACT.phoneDisplay}
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <input
        type="checkbox"
        name="botcheck"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-parent"
            className="text-sm font-medium text-neutral-700"
          >
            Tu nombre (papá/mamá){' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-parent"
              type="text"
              name="nombreAcudiente"
              required
              minLength={2}
              placeholder="Ej. María González"
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>

        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-phone"
            className="text-sm font-medium text-neutral-700"
          >
            Teléfono / WhatsApp{' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-phone"
              type="tel"
              name="telefono"
              required
              placeholder="Ej. 300 123 4567"
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-child"
            className="text-sm font-medium text-neutral-700"
          >
            Nombre del niño / niña{' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-child"
              type="text"
              name="nombreNino"
              required
              minLength={2}
              placeholder="Ej. Juan Camilo"
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>

        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-birth"
            className="text-sm font-medium text-neutral-700"
          >
            Fecha de nacimiento del niño/a{' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-birth"
              type="date"
              name="fechaNacimiento"
              required
              min={formatearFechaISO(RANGO.min)}
              max={formatearFechaISO(RANGO.max)}
              value={childDate}
              onChange={(e) => setChildDate(e.target.value)}
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
          {suggestedCat && (
            <p
              className="text-brand-navy text-xs"
              role="status"
              aria-live="polite"
            >
              ✓ Categoría: <strong>{suggestedCat}</strong>
            </p>
          )}
          {fechaNino && !suggestedCat && (
            <p
              className="text-xs text-neutral-500"
              role="status"
              aria-live="polite"
            >
              Por ahora las categorías llegan hasta los 16 años — escribinos por
              WhatsApp.
            </p>
          )}
        </div>
      </div>

      <div className="field-wrap relative flex flex-col gap-1.5">
        <label
          htmlFor="cf-email"
          className="text-sm font-medium text-neutral-700"
        >
          Tu email (opcional)
        </label>
        <div className="relative">
          <input
            id="cf-email"
            type="email"
            name="emailAcudiente"
            placeholder="Ej. maria@correo.com"
            className={inputClass}
          />
          <span className="field-underline" aria-hidden="true" />
        </div>
      </div>

      <div className="field-wrap relative flex flex-col gap-1.5">
        <label
          htmlFor="cf-message"
          className="text-sm font-medium text-neutral-700"
        >
          Mensaje / preguntas (opcional)
        </label>
        <div className="relative">
          <textarea
            id="cf-message"
            name="mensaje"
            rows={3}
            placeholder="¿Alguna pregunta sobre horarios, costos o el programa?"
            className={`resize-none ${inputClass}`}
          />
          <span className="field-underline" aria-hidden="true" />
        </div>
      </div>

      {status === 'error' && (
        <p
          className="bg-error/10 text-error rounded-lg px-4 py-2.5 text-sm"
          role="alert"
        >
          Hubo un error al enviar. Intentá de nuevo o escribinos al WhatsApp.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        aria-busy={status === 'submitting'}
        className="bg-brand-gold shadow-brand-gold/30 hover:bg-brand-gold-deep focus-visible:outline-brand-gold flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-neutral-900 shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Enviando...
          </>
        ) : (
          '¡Quiero inscribirme gratis!'
        )}
      </button>
    </form>
  );
}
