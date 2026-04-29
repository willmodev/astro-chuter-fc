export const SITE = {
  name: 'Chuter FC',
  legalName: 'Club Deportivo Chuter F.C.',
  tagline: 'Formando campeones dentro y fuera de la cancha',
  description:
    'Escuela de fútbol para niños y niñas en Los Algarrobillos, avalada por INDER. Inscripción gratis. Categorías Baby, Pony, Benjamín, Pre-infantil e Infantil.',
  shortDescription:
    'Escuela de fútbol para niños y niñas en Los Algarrobillos. Avalada por INDER.',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://chuterfc.vercel.app',
  locale: 'es_CO',
  language: 'es',
} as const;

export const CONTACT = {
  whatsappNumber: import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '573015216830',
  phoneDisplay: '301 521 6830',
  phoneE164: '+573015216830',
  instagramUrl:
    import.meta.env.PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/1chuter',
  instagramHandle: '@1chuter',
} as const;

// TODO: pedir a Camilo — confirmar ciudad y departamento exactos del barrio Los Algarrobillos
export const LOCATION = {
  venue: 'Cancha de la Provincia',
  neighborhood: 'Los Algarrobillos',
  city: 'Colombia',
  region: '',
  country: 'CO',
} as const;

export const SCHEDULE = {
  daysHuman: 'Lunes, miércoles y viernes',
  hoursHuman: '4:30 PM a 6:00 PM',
  schemaOpeningHours: 'Mo,We,Fr 16:30-18:00',
} as const;

export const PROMO = {
  hook: '¡Inscripción Gratis!',
  hookShort: 'Inscripción gratis',
} as const;

export const COACHES = [
  {
    name: 'Camilo Andrade',
    role: 'CEO y Director Técnico',
    instagram: 'camilo8andrade',
    instagramUrl: 'https://instagram.com/camilo8andrade',
  },
  {
    name: 'Ebed Shaday Calderón',
    role: 'CEO y Director Técnico',
    instagram: 'ebedshadaycalderon',
    instagramUrl: 'https://instagram.com/ebedshadaycalderon',
  },
] as const;

export const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Programas', href: '#programas' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Formadores', href: '#formadores' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Ubicación', href: '#ubicacion' },
  { label: 'Contacto', href: '#contacto' },
] as const;
