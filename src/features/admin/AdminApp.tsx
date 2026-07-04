import { useState } from 'react';

import { AdminShell } from './chrome/AdminShell';
import { IconButton } from './chrome/IconButton';
import { type TabId } from './chrome/tabs';
import { useDashboardData } from './hooks/useDashboardData';
import { Dashboard } from './screens/dashboard/Dashboard';

// Router interno mínimo por estado de vista. Solo `dashboard` renderiza
// contenido real (llega en el Bloque C); las demás tabs y el FAB muestran
// un placeholder "Próximamente" (sus pantallas viven en otros specs).
const META: Record<TabId, { title: string; eyebrow: string }> = {
  dashboard: { title: 'Dashboard', eyebrow: 'Temporada 2026' },
  alumnos: { title: 'Alumnos', eyebrow: 'Inscripciones' },
  cartera: { title: 'Cartera', eyebrow: 'Control de cobros' },
  mas: { title: 'Más', eyebrow: 'Club Chuter F.C.' },
};

export function AdminApp() {
  const [view, setView] = useState<TabId>('dashboard');
  const [actionOpen, setActionOpen] = useState(false);
  const data = useDashboardData();
  const meta = META[view];

  const right =
    view === 'dashboard' ? (
      <IconButton icon="bell" label="Notificaciones" badge={data.stats.morosos} />
    ) : undefined;

  return (
    <>
      <AdminShell
        active={view}
        onTab={setView}
        onAction={() => setActionOpen(true)}
        title={meta.title}
        eyebrow={meta.eyebrow}
        right={right}
      >
        {view === 'dashboard' ? (
          <Dashboard data={data} onNav={setView} />
        ) : (
          <ComingSoon label={`${meta.title} · Próximamente`} />
        )}
      </AdminShell>

      {actionOpen && <ActionPlaceholder onClose={() => setActionOpen(false)} />}
    </>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 240,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div>
        <p className="eyebrow">Chuter FC · Back-office</p>
        <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-body)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function ActionPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(10,15,26,0.45)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface-card)',
          borderRadius: '22px 22px 0 0',
          boxShadow: 'var(--shadow-pop)',
          padding: '28px 24px calc(28px + env(safe-area-inset-bottom))',
          textAlign: 'center',
        }}
      >
        <p className="eyebrow">Acción rápida</p>
        <h3 style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
          Próximamente
        </h3>
        <p style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Registrar pago e inscribir alumno llegan en otro spec.
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            height: 44,
            width: '100%',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
