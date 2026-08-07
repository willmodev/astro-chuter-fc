const inputClass =
  'w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20';

interface Props {
  childDate: string;
  onChildDate: (valor: string) => void;
  suggestedCat: string | null;
  fueraDeRango: boolean;
  minFecha: string;
  maxFecha: string;
}

export function ContactFields({
  childDate,
  onChildDate,
  suggestedCat,
  fueraDeRango,
  minFecha,
  maxFecha,
}: Props) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-parent"
            className="text-sm font-medium text-neutral-700"
          >
            Tu nombre (papá/mamá){' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-parent"
              type="text"
              name="nombreAcudiente"
              required
              minLength={2}
              placeholder="Ej. María González"
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>

        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-phone"
            className="text-sm font-medium text-neutral-700"
          >
            Teléfono / WhatsApp{' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-phone"
              type="tel"
              name="telefono"
              required
              placeholder="Ej. 300 123 4567"
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-child"
            className="text-sm font-medium text-neutral-700"
          >
            Nombre del niño / niña{' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-child"
              type="text"
              name="nombreNino"
              required
              minLength={2}
              placeholder="Ej. Juan Camilo"
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
        </div>

        <div className="field-wrap relative flex flex-col gap-1.5">
          <label
            htmlFor="cf-birth"
            className="text-sm font-medium text-neutral-700"
          >
            Fecha de nacimiento del niño/a{' '}
            <span className="text-error" aria-label="campo requerido">
              *
            </span>
          </label>
          <div className="relative">
            <input
              id="cf-birth"
              type="date"
              name="fechaNacimiento"
              required
              min={minFecha}
              max={maxFecha}
              value={childDate}
              onChange={(e) => onChildDate(e.target.value)}
              className={inputClass}
            />
            <span className="field-underline" aria-hidden="true" />
          </div>
          {suggestedCat && (
            <p
              className="text-brand-navy text-xs"
              role="status"
              aria-live="polite"
            >
              ✓ Categoría: <strong>{suggestedCat}</strong>
            </p>
          )}
          {fueraDeRango && (
            <p
              className="text-xs text-neutral-500"
              role="status"
              aria-live="polite"
            >
              Por ahora las categorías llegan hasta los 16 años — escribinos por
              WhatsApp.
            </p>
          )}
        </div>
      </div>

      <div className="field-wrap relative flex flex-col gap-1.5">
        <label
          htmlFor="cf-email"
          className="text-sm font-medium text-neutral-700"
        >
          Tu email (opcional)
        </label>
        <div className="relative">
          <input
            id="cf-email"
            type="email"
            name="emailAcudiente"
            placeholder="Ej. maria@correo.com"
            className={inputClass}
          />
          <span className="field-underline" aria-hidden="true" />
        </div>
      </div>

      <div className="field-wrap relative flex flex-col gap-1.5">
        <label
          htmlFor="cf-message"
          className="text-sm font-medium text-neutral-700"
        >
          Mensaje / preguntas (opcional)
        </label>
        <div className="relative">
          <textarea
            id="cf-message"
            name="mensaje"
            rows={3}
            placeholder="¿Alguna pregunta sobre horarios, costos o el programa?"
            className={`resize-none ${inputClass}`}
          />
          <span className="field-underline" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
