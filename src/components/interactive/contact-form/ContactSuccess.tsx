import { CONTACT } from '@/lib/site';
import { WA_FAB } from '@/lib/whatsapp';

// Estado final del formulario: reemplaza los campos tras un envío exitoso.
export function ContactSuccess() {
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
