export interface UsuarioRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'entrenador';
  activo: boolean; // = !banned
  cats: string[];
}

export interface NuevoUsuarioInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'entrenador';
  cats: string[]; // [] si role = 'admin'
}
