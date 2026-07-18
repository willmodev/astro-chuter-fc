import { useId, useState, type ChangeEvent } from 'react';

import { Icon } from '../../chrome/Icon';
import { CampoTexto } from '../../ui/CampoTexto';
import { VisorImagen } from '../../ui/VisorImagen';

// Parte central del día: la planeación hecha en TactalPad entra como imagen
// (file input + preview local, reemplazable) con nota de respaldo opcional.
interface Props {
  img: string | null;
  nota: string;
  setNota: (v: string) => void;
  onElegirImagen: (file: File) => void;
}

export function ParteCentral({ img, nota, setNota, onElegirImagen }: Readonly<Props>) {
  const inputId = useId();
  const [verVisor, setVerVisor] = useState(false);

  const alCambiar = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onElegirImagen(file);
    e.target.value = ''; // permite re-elegir el mismo archivo
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: '14px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span className="eyebrow">Parte central · planeación TactalPad</span>

      {img !== null && (
        <button
          type="button"
          onClick={() => setVerVisor(true)}
          aria-label="Ampliar la planeación"
          style={{
            padding: 0,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-sunken)',
            cursor: 'zoom-in',
            overflow: 'hidden',
          }}
        >
          <img
            src={img}
            alt="Planeación de la parte central"
            style={{
              display: 'block',
              width: '100%',
              maxHeight: 260,
              objectFit: 'contain',
            }}
          />
        </button>
      )}

      {verVisor && img !== null && (
        <VisorImagen src={img} onClose={() => setVerVisor(false)} />
      )}

      <label
        htmlFor={inputId}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 46,
          borderRadius: 'var(--radius-md)',
          border: img === null ? '1.5px dashed var(--brand-gold)' : '1px solid var(--border-subtle)',
          background: img === null ? 'var(--brand-gold-soft)' : 'var(--surface-sunken)',
          color: img === null ? 'var(--brand-gold-deep)' : 'var(--brand-navy)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Icon name="image-plus" size={18} />
        {img === null ? 'Subir imagen de la planeación' : 'Reemplazar imagen'}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={alCambiar}
        className="sr-only"
      />

      <CampoTexto
        label="Nota"
        value={nota}
        onChange={setNota}
        placeholder="Ej. Conducción en zig-zag con conos"
        opcional
      />
    </div>
  );
}
