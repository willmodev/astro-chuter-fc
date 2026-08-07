import { ContactFields } from './contact-form/ContactFields';
import { ContactSuccess } from './contact-form/ContactSuccess';
import { useContactForm } from './contact-form/useContactForm';

export default function ContactForm() {
  const {
    status,
    childDate,
    setChildDate,
    suggestedCat,
    fueraDeRango,
    minFecha,
    maxFecha,
    enviar,
  } = useContactForm();

  if (status === 'success') {
    return <ContactSuccess />;
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-5" noValidate>
      <input
        type="checkbox"
        name="botcheck"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />

      <ContactFields
        childDate={childDate}
        onChildDate={setChildDate}
        suggestedCat={suggestedCat}
        fueraDeRango={fueraDeRango}
        minFecha={minFecha}
        maxFecha={maxFecha}
      />

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
