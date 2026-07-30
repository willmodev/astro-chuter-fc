import {
  cambiarActivo as cambiarActivoAlumno,
  crear as crearAlumno,
  editar,
  listar as listarAlumnos,
} from '@/actions/alumnos';
import { enviarContacto } from '@/actions/contacto';
import { stats } from '@/actions/dashboard';
import {
  guardarAsistenciaDia,
  guardarPlanSemana,
  guardarPlaneacionDia,
  listar as listarEntrenos,
} from '@/actions/entrenos';
import { registrar as registrarPago } from '@/actions/pagos';
import {
  anularEntregaKit,
  listar as listarUniformes,
  registrarEntregaKit,
  registrarPagoKit,
} from '@/actions/uniformes';
import {
  categoriasAsignables,
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
    categoriasAsignables,
  },
  alumnos: {
    listar: listarAlumnos,
    crear: crearAlumno,
    editar,
    cambiarActivo: cambiarActivoAlumno,
  },
  pagos: {
    registrar: registrarPago,
  },
  uniformes: {
    listar: listarUniformes,
    registrarEntrega: registrarEntregaKit,
    anularEntrega: anularEntregaKit,
    registrarPago: registrarPagoKit,
  },
  entrenos: {
    listar: listarEntrenos,
    guardarPlan: guardarPlanSemana,
    guardarPlaneacion: guardarPlaneacionDia,
    guardarAsistencia: guardarAsistenciaDia,
  },
  dashboard: {
    stats,
  },
};
