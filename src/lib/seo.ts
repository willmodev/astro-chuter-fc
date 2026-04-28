import { SITE, CONTACT, LOCATION, SCHEDULE } from '@/lib/site';

export interface PageSeo {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  canonical?: string;
}

export function pageTitle(section?: string): string {
  return section ? `${section} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
}

export function buildSportsActivityLocationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${SITE.url}/#organization`,
    name: SITE.legalName,
    alternateName: SITE.name,
    description: `${SITE.description} Reconocimiento Deportivo otorgado por INDER.`,
    url: SITE.url,
    telephone: CONTACT.phoneE164,
    image: `${SITE.url}/logo-temp.png`,
    logo: `${SITE.url}/logo-temp.png`,
    sport: 'Soccer',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${LOCATION.venue}, ${LOCATION.neighborhood}`,
      addressLocality: LOCATION.city,
      ...(LOCATION.region && { addressRegion: LOCATION.region }),
      addressCountry: LOCATION.country,
    },
    openingHours: SCHEDULE.schemaOpeningHours,
    sameAs: [CONTACT.instagramUrl],
  } as const;
}
