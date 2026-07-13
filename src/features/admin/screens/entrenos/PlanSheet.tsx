import { useState } from 'react';

import { Sheet } from '../../chrome/Sheet';
import { CampoTexto } from '../../ui/CampoTexto';
import type { PlanSemana } from '../../data/types';

// Hoja modal del plan semanal (patrón HojaEntrega, spec 08): tema + objetivos.
// Sirve para registrar y para editar; guardar es idempotente en el store.
interface Props {
  plan: PlanSemana | null;
  semanaLabel: string;
  onGuardar: (tema: string, objetivos: string) => void;
  onClose: () => void;
}

export function PlanSheet({ plan, semanaLabel, onGuardar, onClose }: Readonly<Props>) {
  const [tema, setTema] = useState(plan?.tema ?? '');
  const [objetivos, setObjetivos] = useState(plan?.objetivos ?? '');
  const valido = tema.trim() !== '';

  return (
    <Sheet title={`Plan semanal · ${semanaLabel}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <CampoTexto
          label="Tema"
          value={tema}
          onChange={setTema}
          placeholder="Ej. Control y conducción"
        />
        <label style={{ display: 'grid', gap: 6 }}>
          <span className="eyebrow">Objetivos</span>
          <textarea
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value)}
            rows={4}
            placeholder="Qué se busca lograr esta semana"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'none',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-card)',
              color: 'var(--text-strong)',
              fontSize: 15,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.4,
              outline: 'none',
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => onGuardar(tema, objetivos)}
          disabled={!valido}
          style={{
            height: 48,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: valido ? 'var(--brand-navy)' : 'var(--neutral-300)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: valido ? 'pointer' : 'not-allowed',
          }}
        >
          {plan ? 'Guardar cambios' : 'Registrar plan'}
        </button>
      </div>
    </Sheet>
  );
}
