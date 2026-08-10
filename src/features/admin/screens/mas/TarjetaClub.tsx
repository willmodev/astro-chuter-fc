import { CONTACT, LOCATION, SCHEDULE, SITE } from '@/lib/site';
import { WA_FAB } from '@/lib/whatsapp';

import { InfoRow } from './InfoRow';

// Identidad y contacto del club (HU-7.1). La ven admin y entrenador por
// igual: no lleva dinero ni datos de alumnos. Todo sale de `lib/site.ts`.
export function TarjetaClub() {
  return (
    <>
      <div
        className="bg-pitch-lines"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 18,
          borderRadius: 'var(--radius-lg)',
          background:
            'linear-gradient(160deg, var(--brand-navy), var(--brand-navy-deep))',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <img
          src="/images/chuter-logo.svg"
          alt=""
          width={52}
          height={52}
          style={{ flexShrink: 0, objectFit: 'contain' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
            {SITE.legalName}
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--brand-gold)', marginTop: 2 }}
          >
            {SITE.tagline}
          </div>
        </div>
      </div>

      <span className="eyebrow" style={{ padding: '2px 2px 0' }}>
        Contacto y sede
      </span>
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <InfoRow
          icon="message-circle"
          title="WhatsApp"
          sub={CONTACT.phoneDisplay}
          href={WA_FAB}
        />
        <InfoRow
          icon="map-pin"
          title={LOCATION.venue}
          sub={`${LOCATION.neighborhood} · ${LOCATION.city}, ${LOCATION.region} · INDER`}
          href={LOCATION.mapsUrl}
          borde
        />
        <InfoRow
          icon="map-pin"
          title={LOCATION.secondaryVenue}
          sub="Cancha alterna"
          href={LOCATION.secondaryMapsUrl}
          borde
        />
        <InfoRow
          icon="clock"
          title={SCHEDULE.daysHuman}
          sub={SCHEDULE.hoursHuman}
          borde
        />
        <InfoRow
          icon="at-sign"
          title="Instagram"
          sub={CONTACT.instagramHandle}
          href={CONTACT.instagramUrl}
          borde
        />
      </div>
    </>
  );
}
