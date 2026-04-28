import { CONTACT } from '@/lib/site';

const BASE = `https://wa.me/${CONTACT.whatsappNumber}`;

export function whatsappURL(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

export const WA_HERO = whatsappURL(
  'Hola Chuter FC, quiero información para inscribir a mi hijo',
);

export const WA_FAB = whatsappURL('Hola Chuter FC');

export function waCategory(categoryName: string): string {
  return whatsappURL(
    `Hola Chuter FC, quiero inscribir a mi hijo en la categoría ${categoryName}`,
  );
}
