import { crear as crearAlumno, editar, listar as listarAlumnos } from '@/actions/alumnos';
import { enviarContacto } from '@/actions/contacto';
import { stats } from '@/actions/dashboard';
import { registrar as registrarPago } from '@/actions/pagos';
import {
  crear,
  listar,
  resetPassword,
  toggleActivo,
} from '@/actions/usuarios';

export const server = {
  enviarContacto,
  usuarios: {
    listar,
    crear,
    toggleActivo,
    resetPassword,
  },
  alumnos: {
    listar: listarAlumnos,
    crear: crearAlumno,
    editar,
  },
  pagos: {
    registrar: registrarPago,
  },
  dashboard: {
    stats,
  },
};
