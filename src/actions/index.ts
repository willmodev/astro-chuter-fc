import { enviarContacto } from '@/actions/contacto';
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
};
