// SubmitEvent de React (React 19 deprecó FormEvent); no es el SubmitEvent del DOM.
import { useMemo, useState, type CSSProperties, type SubmitEvent } from 'react';

import { traspasosDe } from '@/lib/domain/usuarios';

import { Sheet } from '../../chrome/Sheet';

import { SelectorCategorias } from './SelectorCategorias';
import { useCategoriasAsignables } from './useCategoriasAsignables';

import type { EditarUsuarioInput, UsuarioRow } from './types';

interface Props {
  usuario: UsuarioRow;
  onClose: () => void;
  onEditar: (input: EditarUsuarioInput) => Promise<string | null>;
}

const field: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  fontSize: 15,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-strong)',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
};

const lbl: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-body)',
  marginBottom: 5,
  display: 'block',
};

const nota: CSSProperties = {
  margin: '5px 0 0',
  fontSize: 12,
  color: 'var(--text-muted)',
};

export function EditarUsuarioSheet({
  usuario,
  onClose,
  onEditar,
}: Readonly<Props>) {
  const [name, setName] = useState(usuario.name);
  const [email, setEmail] = useState(usuario.email);
  const [cats, setCats] = useState<string[]>(usuario.cats);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { categorias, cargando } = useCategoriasAsignables(usuario.id);

  const esEntrenador = usuario.role === 'entrenador';
  const puedeAsignar = esEntrenador && usuario.activo;
  const traspasos = useMemo(
    () => traspasosDe(cats, categorias),
    [cats, categorias],
  );

  function alternarCat(etiqueta: string): void {
    setCats((prev) =>
      prev.includes(etiqueta)
        ? prev.filter((c) => c !== etiqueta)
        : [...prev, etiqueta],
    );
  }

  async function onSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const fallo = await onEditar({
      userId: usuario.id,
      name: name.trim(),
      email: email.trim(),
      cats: puedeAsignar ? cats : [],
    });
    if (fallo) {
      setError(fallo);
      setEnviando(false);
      return;
    }
    onClose();
  }

  return (
    <Sheet title="Editar usuario" onClose={onClose}>
      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{ display: 'grid', gap: 12 }}
      >
        {error && (
          <div className="admin-login__error" role="alert">
            {error}
          </div>
        )}
        <div>
          <label style={lbl} htmlFor="eu-name">
            Nombre
          </label>
          <input
            id="eu-name"
            style={field}
            value={name}
            required
            minLength={2}
            onChange={(e) => {
              setName(e.target.value);
            }}
            disabled={enviando}
          />
        </div>
        <div>
          <label style={lbl} htmlFor="eu-email">
            Correo
          </label>
          <input
            id="eu-email"
            type="email"
            style={field}
            value={email}
            required
            autoComplete="off"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            disabled={enviando}
          />
          <p style={nota}>
            Es el correo con el que inicia sesión: si lo cambiás, el anterior
            deja de servir.
          </p>
        </div>
        {esEntrenador && (
          <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
            <legend style={lbl}>Categorías a cargo</legend>
            {puedeAsignar ? (
              <SelectorCategorias
                categorias={categorias}
                cargando={cargando}
                seleccionadas={cats}
                onToggle={alternarCat}
                disabled={enviando}
                permitirTraspaso
              />
            ) : (
              <p style={nota}>
                Reactivá al entrenador para asignarle categorías.
              </p>
            )}
          </fieldset>
        )}
        {traspasos.length > 0 && (
          <div
            role="status"
            style={{
              display: 'grid',
              gap: 3,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-sunken)',
              fontSize: 12.5,
              color: '#946200',
              fontWeight: 600,
            }}
          >
            <span>Al guardar, estas categorías cambian de entrenador:</span>
            {traspasos.map((t) => (
              <span key={t.etiqueta}>
                {t.etiqueta} · hoy de {t.de}
              </span>
            ))}
          </div>
        )}
        <button
          type="submit"
          className="admin-login__submit"
          disabled={enviando}
          style={{ marginTop: 4 }}
        >
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </Sheet>
  );
}
