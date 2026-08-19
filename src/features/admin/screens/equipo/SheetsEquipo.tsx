import { EditarUsuarioSheet } from './EditarUsuarioSheet';
import { NuevoUsuarioSheet } from './NuevoUsuarioSheet';
import { ResetPasswordSheet } from './ResetPasswordSheet';

import type {
  EditarUsuarioInput,
  NuevoUsuarioInput,
  UsuarioRow,
} from './types';

// Las tres hojas de la pantalla Equipo: alta, edición y reseteo de contraseña.
// Solo una está abierta a la vez.
export type SheetState =
  | { tipo: 'nuevo' }
  | { tipo: 'editar'; usuario: UsuarioRow }
  | { tipo: 'reset'; usuario: UsuarioRow }
  | null;

interface Props {
  sheet: SheetState;
  onClose: () => void;
  onCrear: (input: NuevoUsuarioInput) => Promise<string | null>;
  onEditar: (input: EditarUsuarioInput) => Promise<string | null>;
  onReset: (userId: string, password: string) => Promise<string | null>;
}

export function SheetsEquipo({
  sheet,
  onClose,
  onCrear,
  onEditar,
  onReset,
}: Readonly<Props>) {
  if (!sheet) return null;

  if (sheet.tipo === 'nuevo') {
    return <NuevoUsuarioSheet onClose={onClose} onCrear={onCrear} />;
  }

  if (sheet.tipo === 'editar') {
    return (
      <EditarUsuarioSheet
        usuario={sheet.usuario}
        onClose={onClose}
        onEditar={onEditar}
      />
    );
  }

  return (
    <ResetPasswordSheet
      nombre={sheet.usuario.name}
      onClose={onClose}
      onReset={(password) => onReset(sheet.usuario.id, password)}
    />
  );
}
