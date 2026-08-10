import canteraGrupo from '@/assets/images/club/cantera-grupo.jpg';
import canteraRetrato from '@/assets/images/club/cantera-retrato.jpg';
import canteraSaludo from '@/assets/images/club/cantera-saludo.webp';
import canteraTrofeos from '@/assets/images/club/cantera-trofeos.jpg';
import familiaAbrazo from '@/assets/images/club/familia-abrazo.jpg';
import familiaCharla from '@/assets/images/club/familia-charla.jpg';
import familiaCirculo from '@/assets/images/club/familia-circulo.jpg';
import familiaCirculoRosa from '@/assets/images/club/familia-circulo-rosa.jpg';
import familiaHidratacion from '@/assets/images/club/familia-hidratacion.jpg';
import juegoCarrera from '@/assets/images/club/juego-carrera.jpg';
import juegoDescanso from '@/assets/images/club/juego-descanso.jpg';
import juegoDisputa from '@/assets/images/club/juego-disputa.jpg';
import juegoEspalda from '@/assets/images/club/juego-espalda.jpg';

import type { ImageMetadata } from 'astro';

export interface FotoGaleria {
  src: ImageMetadata;
  /** Texto accesible: describe la escena para quien no ve la foto. */
  alt: string;
  /** Cédula de museo: pie corto visible bajo la pieza. */
  cedula: string;
  /** Cómo ocupa la retícula de 4 columnas en desktop. */
  gridClass: string;
}

export interface SalaGaleria {
  numero: string;
  titulo: string;
  descripcion: string;
  fotos: FotoGaleria[];
}

export const SALAS_GALERIA: readonly SalaGaleria[] = [
  {
    numero: '01',
    titulo: 'La cantera',
    descripcion:
      'Los que apenas empiezan. Desde los 3 años, con la camiseta puesta ' +
      'antes de saber atarse los guayos.',
    fotos: [
      {
        src: canteraRetrato,
        alt: 'Niño de Chuter FC descansando sobre la grama antes de entrenar',
        cedula: 'Antes del pito inicial',
        gridClass: 'md:row-span-2',
      },
      {
        src: canteraSaludo,
        alt: 'Niño de Chuter FC saludando a la cámara con su uniforme azul',
        cedula: 'La camiseta puesta',
        gridClass: 'md:row-span-2',
      },
      {
        src: canteraGrupo,
        alt: 'Grupo de los más pequeños de Chuter FC posando en la cancha',
        cedula: 'La formación de los más pequeños',
        gridClass: 'md:col-span-2 md:row-span-2',
      },
      {
        src: canteraTrofeos,
        alt: 'Plantel de Chuter FC posando en la cancha con cinco trofeos',
        cedula: 'Los primeros trofeos',
        gridClass: 'md:col-span-2 md:row-span-2',
      },
    ],
  },
  {
    numero: '02',
    titulo: 'En juego',
    descripcion:
      'El balón de por medio. Aquí se aprende a competir sin dejar de ' +
      'jugar.',
    fotos: [
      {
        src: juegoCarrera,
        alt: 'Niño de Chuter FC corriendo con el balón durante el entrenamiento',
        cedula: 'Salida en velocidad',
        gridClass: 'md:row-span-2',
      },
      {
        src: juegoDisputa,
        alt: 'Dos niños de Chuter FC disputando el balón en la cancha',
        cedula: 'La disputa',
        gridClass: 'md:row-span-2',
      },
      {
        src: juegoEspalda,
        alt: 'Jugador de Chuter FC de espaldas, con el dorsal 26 en la camiseta',
        cedula: 'Dorsal 26',
        gridClass: 'md:row-span-2',
      },
      {
        src: juegoDescanso,
        alt: 'Niño de Chuter FC recostado en la grama tras el entrenamiento',
        cedula: 'El respiro',
        gridClass: 'md:row-span-2',
      },
    ],
  },
  {
    numero: '03',
    titulo: 'La familia Chuter',
    descripcion:
      'Lo que pasa alrededor de la cancha: las familias, el grupo y la ' +
      'gente del barrio.',
    fotos: [
      {
        src: familiaHidratacion,
        alt: 'Entrenador de Chuter FC dándole agua a uno de los niños',
        cedula: 'La pausa de hidratación',
        gridClass: 'md:row-span-2',
      },
      {
        src: familiaAbrazo,
        alt: 'Grupo de niños de Chuter FC abrazados posando juntos',
        cedula: 'El grupo, al final del día',
        gridClass: 'md:col-span-2',
      },
      {
        src: familiaCirculoRosa,
        alt: 'Equipo de Chuter FC reunido en círculo con el entrenador',
        cedula: 'El círculo antes de empezar',
        gridClass: 'md:row-span-2',
      },
      {
        src: familiaCirculo,
        alt: 'Charla técnica de Chuter FC: el grupo sentado alrededor del formador',
        cedula: 'La charla, sentados en la grama',
        gridClass: 'md:col-span-2',
      },
      {
        src: familiaCharla,
        alt: 'Equipo de Chuter FC en círculo alrededor del formador al atardecer',
        cedula: 'El círculo del formador',
        gridClass: 'md:col-span-2 md:row-span-2',
      },
    ],
  },
];
