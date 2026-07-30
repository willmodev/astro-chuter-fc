export interface UsuarioRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'entrenador';
  activo: boolean; // = !banned
  cats: string[];
}

// Una categoría del catálogo en el selector del alta: `ocupadaPor` trae el
// nombre del entrenador activo que la tiene (null = libre).
export interface CategoriaAsignable {
  etiqueta: string; // 'SUB 8'
  nombre: string; // 'Benjamín'
  ocupadaPor: string | null;
}

export interface NuevoUsuarioInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'entrenador';
  cats: string[]; // [] si role = 'admin'
}
