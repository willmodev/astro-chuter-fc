import { useState } from 'react';
import { Dialog } from 'radix-ui';
import { Menu, X, MessageCircle } from 'lucide-react';

import { WA_HERO } from '@/lib/whatsapp';

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Programas', href: '#programas' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Historia', href: '#historia' },
  { label: 'Equipo', href: '#equipo' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Ubicación', href: '#ubicacion' },
  { label: 'Contacto', href: '#contacto' },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2"
      >
        <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-brand-navy/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>

          <div className="flex items-center justify-between border-b border-neutral-100 p-4">
            <span className="font-display text-xl text-brand-navy">
              CHUTER<span className="text-brand-gold">FC</span>
            </span>
            <Dialog.Close
              aria-label="Cerrar menú"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2"
            >
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </Dialog.Close>
          </div>

          <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto">
            <ul className="flex flex-col py-4">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center px-6 py-3 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-neutral-100 p-4">
            <a
              href={WA_HERO}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-brand-gold-deep focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2"
            >
              <MessageCircle size={16} strokeWidth={1.5} aria-hidden="true" />
              ¡Inscripción Gratis!
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
