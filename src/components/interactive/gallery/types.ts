/** Pieza ya procesada por Astro, lista para el navegador. */
export interface PiezaGaleria {
  src: string;
  thumbnail: string;
  alt: string;
  cedula: string;
  width: number;
  height: number;
  gridClass: string;
}

/** Sala con sus piezas y el índice global de cada una en el recorrido. */
export interface SalaRenderizada {
  numero: string;
  titulo: string;
  descripcion: string;
  piezas: PiezaGaleria[];
  /** Índice de la primera pieza dentro del recorrido completo. */
  offset: number;
}
