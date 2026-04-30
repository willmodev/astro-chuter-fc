import { useState, type FormEvent } from 'react';

const CATEGORIES = [
  { label: 'Baby (nacidos 2020-2021)', years: [2020, 2021] },
  { label: 'Pony (nacidos 2018-2019)', years: [2018, 2019] },
  { label: 'Benjamín (nacidos 2016-2017)', years: [2016, 2017] },
  { label: 'Pre-infantil (nacidos 2014-2015)', years: [2014, 2015] },
  { label: 'Infantil (nacidos 2012-2013)', years: [2012, 2013] },
];

function suggestCategory(birthYear: number): string | null {
  const cat = CATEGORIES.find(({ years }) => years.includes(birthYear));
  return cat?.label ?? null;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [childYear, setChildYear] = useState('');
  const suggestedCat = childYear ? suggestCategory(Number(childYear)) : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(WEB3FORMS_URL, { method: 'POST', body: data });
      const json = (await res.json()) as { success: boolean };
      if (json.success) {
        setStatus('success');
        form.reset();
        setChildYear('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-success/10 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/20">
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-800">¡Mensaje enviado!</p>
          <p className="mt-1 text-sm text-neutral-500">
            Te contactaremos pronto. También podés escribirnos directo por WhatsApp al{' '}
            <a
              href="https://wa.me/573015216830"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-navy underline-offset-2 hover:underline"
            >
              301 521 6830
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="access_key" value={import.meta.env.PUBLIC_WEB3FORMS_KEY ?? ''} />
      <input type="hidden" name="subject" value="Nueva consulta de inscripción — Chuter FC" />
      <input type="hidden" name="from_name" value="Sitio Chuter FC" />
      <input type="checkbox" name="botcheck" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field-wrap relative flex flex-col gap-1.5">
          <label htmlFor="cf-parent" className="text-sm font-medium text-neutral-700">
            Tu nombre (papá/mamá) <span className="text-error" aria-label="campo requerido">*</span>
          </label>
          <div className="relative">
            <input
              id="cf-parent"
              type="text"
              name="nombre_acudiente"
              required
              minLength={2}
              placeholder="Ej. María González"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>

        <div className="field-wrap relative flex flex-col gap-1.5">
          <label htmlFor="cf-phone" className="text-sm font-medium text-neutral-700">
            Teléfono / WhatsApp <span className="text-error" aria-label="campo requerido">*</span>
          </label>
          <div className="relative">
            <input
              id="cf-phone"
              type="tel"
              name="telefono"
              required
              placeholder="Ej. 300 123 4567"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field-wrap relative flex flex-col gap-1.5">
          <label htmlFor="cf-child" className="text-sm font-medium text-neutral-700">
            Nombre del niño / niña <span className="text-error" aria-label="campo requerido">*</span>
          </label>
          <div className="relative">
            <input
              id="cf-child"
              type="text"
              name="nombre_nino"
              required
              minLength={2}
              placeholder="Ej. Juan Camilo"
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>

        <div className="field-wrap relative flex flex-col gap-1.5">
          <label htmlFor="cf-year" className="text-sm font-medium text-neutral-700">
            Año de nacimiento del niño/a <span className="text-error" aria-label="campo requerido">*</span>
          </label>
          <div className="relative">
            <input
              id="cf-year"
              type="number"
              name="anio_nacimiento"
              required
              min={2010}
              max={2022}
              placeholder="Ej. 2018"
              value={childYear}
              onChange={(e) => setChildYear(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
          {suggestedCat && (
            <p className="text-xs text-brand-navy" role="status" aria-live="polite">
              ✓ Categoría sugerida: <strong>{suggestedCat}</strong>
            </p>
          )}
          {childYear && !suggestedCat && (
            <p className="text-xs text-neutral-500" role="status" aria-live="polite">
              Año fuera de las categorías actuales — consultanos igual.
            </p>
          )}
        </div>
      </div>

      <div className="field-wrap relative flex flex-col gap-1.5">
        <label htmlFor="cf-message" className="text-sm font-medium text-neutral-700">
          Mensaje / preguntas (opcional)
        </label>
        <div className="relative">
          <textarea
            id="cf-message"
            name="mensaje"
            rows={3}
            placeholder="¿Alguna pregunta sobre horarios, costos o el programa?"
            className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
          />
          <span className="field-underline" aria-hidden="true" />
        </div>
      </div>

      {status === 'error' && (
        <p className="rounded-lg bg-error/10 px-4 py-2.5 text-sm text-error" role="alert">
          Hubo un error al enviar. Intentá de nuevo o escribinos al WhatsApp.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        aria-busy={status === 'submitting'}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-6 py-3.5 text-sm font-semibold text-neutral-900 shadow-lg shadow-brand-gold/30 transition-all hover:bg-brand-gold-deep active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2"
      >
        {status === 'submitting' ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
