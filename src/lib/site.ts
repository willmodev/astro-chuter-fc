import {
  EDAD_MAX_CAPTACION,
  EDAD_MIN_CAPTACION,
} from '@/lib/domain/categoria';

export const SITE = {
  name: 'Chuter FC',
  legalName: 'Club Deportivo Chuter F.C.',
  tagline: 'Todo niño es un campeón',
  description:
    'Escuela de fútbol para niños y niñas en Valledupar, Cesar, avalada por INDER. Inscripción gratis. Categorías de Baby a Juvenil, para edades de ' +
    `${String(EDAD_MIN_CAPTACION)} a ${String(EDAD_MAX_CAPTACION)} años.`,
  shortDescription:
    'Escuela de fútbol para niños y niñas en Valledupar. Avalada por INDER.',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://chuterfc.com',
  locale: 'es_CO',
  language: 'es',
} as const;

const whatsappNumber = import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? '573008725964';
const numeroNacional = whatsappNumber.replace(/^57/, '');

export const CONTACT = {
  whatsappNumber,
  phoneE164: `+${whatsappNumber}`,
  phoneDisplay: numeroNacional.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'),
  email: import.meta.env.PUBLIC_CONTACT_EMAIL ?? 'olimak8@hotmail.com',
  instagramUrl:
    import.meta.env.PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/1chuter',
  instagramHandle: '@1chuter',
} as const;

export const LOCATION = {
  venue: 'Cancha Los Algarrobillos',
  neighborhood: 'Los Algarrobillos',
  mapsUrl: 'https://maps.app.goo.gl/yvHRJFxW7WCUhWJQ7',
  secondaryVenue: 'Cancha del 12 de Octubre',
  secondaryVenueShort: '12 de Octubre',
  secondaryMapsUrl: 'https://maps.app.goo.gl/24oxxbufXfMzXnwf9',
  city: 'Valledupar',
  region: 'Cesar',
  country: 'CO',
} as const;

export interface BloqueHorario {
  /** Días del bloque, para leer humano: 'Lunes y miércoles'. */
  dias: string;
  /** Abreviatura para espacios apretados: 'Lun y Mié'. */
  diasCorto: string;
  /** Franja legible: '5:30 a 7:00 PM'. */
  horas: string;
  /** Franja compacta: '5:30–7:00 PM'. */
  horasCorto: string;
  /** Entrada de schema.org: 'Mo,We 17:30-19:00'. */
  schema: string;
}

export const SCHEDULE = {
  bloques: [
    {
      dias: 'Lunes y miércoles',
      diasCorto: 'Lun y Mié',
      horas: '5:30 a 7:00 PM',
      horasCorto: '5:30–7:00 PM',
      schema: 'Mo,We 17:30-19:00',
    },
    {
      dias: 'Viernes',
      diasCorto: 'Vie',
      horas: '3:00 a 4:30 PM',
      horasCorto: '3:00–4:30 PM',
      schema: 'Fr 15:00-16:30',
    },
  ],
  /** Solo los días, sin horas: 'Lunes, miércoles y viernes'. */
  daysHuman: 'Lunes, miércoles y viernes',
  /** Una línea completa: 'Lun y Mié 5:30–7:00 PM · Vie 3:00–4:30 PM'. */
  resumenCorto: 'Lun y Mié 5:30–7:00 PM · Vie 3:00–4:30 PM',
  /** Para el frontmatter derivado de programas y las tarjetas de categoría. */
  resumenPrograma: 'Lun y Mié 5:30–7:00 PM · Vie 3:00–4:30 PM',
  /** Array para el JSON-LD; schema.org acepta varias entradas. */
  schemaOpeningHours: ['Mo,We 17:30-19:00', 'Fr 15:00-16:30'],
} as const;

export const PROMO = {
  hook: '¡Inscripción Gratis!',
  hookShort: 'Inscripción gratis',
} as const;

export const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Programas', href: '#programas' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Historia', href: '#historia' },
  { label: 'Equipo', href: '#equipo' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Ubicación', href: '#ubicacion' },
  { label: 'Contacto', href: '#contacto' },
] as const;
