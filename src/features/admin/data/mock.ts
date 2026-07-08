// ⚠️ DATOS ILUSTRATIVOS — no son registros reales del club. Portados del
// prototipo para dar vida a la UI mientras no hay BD ni Actions. Cuando lleguen
// los datos reales, se cambia SOLO la fuente (el store), no la UI.
import type { Alumno, Cumple, Training } from './types';

export const CATEGORIES = ['SUB 4', 'SUB 6', 'SUB 8', 'SUB 10', 'SUB 12', 'SUB 14', 'SUB 16'];
export const MONTHS = ['FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
export const MONTHS_LONG = ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const CURRENT = 4; // JUN — mes en curso; hasta aquí se cobra

type AlumnoInput = Omit<Alumno, 'talla' | 'uniforme' | 'uniformePago' | 'numero' | 'tipoKit'> &
  Partial<Pick<Alumno, 'talla' | 'uniforme' | 'uniformePago' | 'numero' | 'tipoKit'>>;

// Rellena defaults (talla según categoría, uniforme/pago pendientes) como el
// helper `row()` del prototipo.
function mk(o: AlumnoInput): Alumno {
  return {
    talla: o.cat.replace('SUB ', ''),
    uniforme: 'pendiente',
    uniformePago: 'pendiente',
    numero: null,
    tipoKit: null,
    ...o,
  };
}

export const students: Alumno[] = [
  mk({ id: 1, name: 'Mateo Restrepo Ríos', cat: 'SUB 10', anio: 2015, doc: '1092847561', acu: 'Diana Ríos', phone: '301 521 6830', dir: 'Los Algarrobillos, Mz 4', desde: 'Feb 2024', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pagado', numero: 10, tipoKit: 'AZUL', states: ['paid', 'paid', 'paid', 'paid', 'due', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 2, name: 'Sara Gómez Valencia', cat: 'SUB 8', anio: 2017, doc: '1098221034', acu: 'Carlos Gómez', phone: '300 412 9988', dir: 'Cra 12 #4-21', desde: 'Mar 2024', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pagado', numero: 8, tipoKit: 'DORADO', states: ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 3, name: 'Juan David Ospina', cat: 'SUB 12', anio: 2013, doc: '1090556712', acu: 'Marta Ospina', phone: '311 220 4471', dir: 'Barrio Provincia', desde: 'Feb 2023', cuota: 45000, hermanos: 1, uniforme: 'pendiente', uniformePago: 'pagado', tipoKit: 'DORADO', states: ['due', 'due', 'due', 'due', 'pending', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 4, name: 'Valentina Cardona', cat: 'SUB 10', anio: 2015, doc: '1092118890', acu: 'Jorge Cardona', phone: '320 778 1290', dir: 'Cll 9 #3-15', desde: 'Feb 2024', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pagado', numero: 7, tipoKit: 'AZUL', states: ['paid', 'paid', 'paid', 'paid', 'due', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 5, name: 'Samuel Betancur López', cat: 'SUB 14', anio: 2011, doc: '1089004412', acu: 'Ricardo Betancur', phone: '315 660 0021', dir: 'Los Algarrobillos, Mz 9', desde: 'Feb 2022', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pagado', numero: 14, tipoKit: 'DORADO', states: ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'na', 'na', 'na', 'na'] }),
  mk({ id: 6, name: 'Isabella Jiménez', cat: 'SUB 6', anio: 2019, doc: '1101223344', acu: 'Paola Jiménez', phone: '301 909 5512', dir: 'Cra 7 #11-02', desde: 'Mar 2025', cuota: 40000, hermanos: 2, uniforme: 'pendiente', uniformePago: 'pagado', tipoKit: 'AZUL', states: ['paid', 'due', 'due', 'pending', 'pending', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 7, name: 'Tomás Galvis Mejía', cat: 'SUB 8', anio: 2017, doc: '1098776655', acu: 'Sandra Galvis', phone: '318 334 7765', dir: 'Cll 14 #6-30', desde: 'Feb 2024', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pendiente', numero: 9, tipoKit: 'AZUL', states: ['paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 8, name: 'Emiliano Arboleda', cat: 'SUB 16', anio: 2009, doc: '1087556889', acu: 'Felipe Arboleda', phone: '302 556 8890', dir: 'Barrio Provincia', desde: 'Feb 2022', cuota: 45000, hermanos: 1, uniforme: 'pendiente', states: ['due', 'due', 'due', 'due', 'pending', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 9, name: 'Luciana Vásquez', cat: 'SUB 4', anio: 2021, doc: '1103221009', acu: 'Andrés Vásquez', phone: '313 221 0099', dir: 'Cra 5 #2-44', desde: 'Feb 2025', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pagado', numero: 4, tipoKit: 'DORADO', states: ['paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 10, name: 'Daniel Osorio Marín', cat: 'SUB 12', anio: 2013, doc: '1090998822', acu: 'Luz Marina Osorio', phone: '319 887 2244', dir: 'Cll 9 #3-15', desde: 'Feb 2023', cuota: 45000, hermanos: 1, uniforme: 'entregado', uniformePago: 'pagado', numero: 11, tipoKit: 'AZUL', states: ['paid', 'paid', 'due', 'due', 'pending', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 11, name: 'Antonia Restrepo', cat: 'SUB 6', anio: 2019, doc: '1101445778', acu: 'Mariana Restrepo', phone: '301 445 7781', dir: 'Los Algarrobillos, Mz 4', desde: 'Mar 2024', cuota: 40000, hermanos: 2, uniforme: 'entregado', uniformePago: 'pendiente', numero: 6, tipoKit: 'DORADO', states: ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'na', 'na', 'na', 'na'] }),
  mk({ id: 12, name: 'Martín Cano Díaz', cat: 'SUB 14', anio: 2011, doc: '1089003321', acu: 'Liliana Díaz', phone: '316 990 3321', dir: 'Cra 12 #4-21', desde: 'Feb 2023', cuota: 45000, hermanos: 1, uniforme: 'pendiente', states: ['paid', 'due', 'due', 'pending', 'pending', 'pending', 'pending', 'na', 'na', 'na', 'na'] }),
];

export const trainings: Training[] = [
  { day: 'Lunes', cat: 'SUB 4 – SUB 8', focus: 'Coordinación y juego libre', coach: 'Camilo Andrade', time: '4:30 – 6:00 PM' },
  { day: 'Lunes', cat: 'SUB 10 – SUB 16', focus: 'Técnica individual y conducción', coach: 'Ebed Calderón', time: '4:30 – 6:00 PM' },
  { day: 'Miércoles', cat: 'SUB 4 – SUB 8', focus: 'Psicomotricidad con balón', coach: 'Camilo Andrade', time: '4:30 – 6:00 PM' },
  { day: 'Miércoles', cat: 'SUB 10 – SUB 16', focus: 'Pase y control orientado', coach: 'Ebed Calderón', time: '4:30 – 6:00 PM' },
  { day: 'Viernes', cat: 'Todas', focus: 'Partido formativo y evaluación', coach: 'Camilo + Ebed', time: '4:30 – 6:00 PM' },
];

export const cumple: Cumple[] = [
  { name: 'Sara Gómez Valencia', cat: 'SUB 8', fecha: '12 jun', dias: 3 },
  { name: 'Martín Cano Díaz', cat: 'SUB 14', fecha: '18 jun', dias: 9 },
];
