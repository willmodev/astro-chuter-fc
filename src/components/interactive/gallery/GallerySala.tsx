import type { SalaRenderizada } from './types';

interface GallerySalaProps {
  sala: SalaRenderizada;
  onAbrir: (indiceGlobal: number) => void;
}

export default function GallerySala({ sala, onAbrir }: GallerySalaProps) {
  return (
    <section aria-labelledby={`sala-${sala.numero}`}>
      {/* Rótulo de sala: la "placa" que antecede a las piezas */}
      <div className="reveal-line mb-6 flex items-baseline gap-4 border-t border-neutral-200 pt-5">
        <span className="text-brand-gold font-mono text-xs tracking-[0.3em]">
          SALA {sala.numero}
        </span>
        <div>
          <h3
            id={`sala-${sala.numero}`}
            className="text-brand-navy font-serif text-xl md:text-2xl"
            style={{ fontVariationSettings: "'opsz' 144, 'wght' 500" }}
          >
            {sala.titulo}
          </h3>
          <p className="text-brand-navy/60 mt-1 max-w-md text-sm leading-relaxed">
            {sala.descripcion}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:auto-rows-[190px] md:grid-cols-4 md:gap-4 lg:auto-rows-[230px]">
        {sala.piezas.map((pieza, i) => (
          <figure
            key={pieza.thumbnail}
            style={{ ['--idx' as never]: i }}
            className={`reveal group relative flex flex-col ${pieza.gridClass}`}
          >
            {/* flex-1 + min-h-0: la foto absorbe la altura de la celda y deja
                sitio a la cédula, sin desbordar a la fila siguiente. */}
            <button
              onClick={() => {
                onAbrir(sala.offset + i);
              }}
              aria-label={`Ampliar: ${pieza.cedula}. ${pieza.alt}`}
              className="focus-visible:outline-brand-gold relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:min-h-0 md:flex-1"
            >
              <img
                src={pieza.thumbnail}
                alt={pieza.alt}
                loading="lazy"
                decoding="async"
                style={{ animationDelay: `${String(i * -1.7)}s` }}
                className="thumb-ken-burns h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110"
              />
              <div className="from-brand-navy-deep/60 pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="bg-brand-navy/0 group-hover:bg-brand-navy/15 absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                <svg
                  aria-hidden="true"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </button>

            {/* Cédula: el pie de obra, como en una sala de museo */}
            <figcaption className="text-brand-navy/55 mt-2 shrink-0 font-mono text-[0.7rem] tracking-wide">
              <span className="text-brand-navy/30">
                {sala.numero}.{String(i + 1).padStart(2, '0')}
              </span>{' '}
              {pieza.cedula}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
