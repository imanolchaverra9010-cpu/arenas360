export type Usuario = {
  id: number;
  email: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono?: string | null;
  tenant_id: number;
  rol: string;
  activo: boolean;
  nombre_completo: string;
  image?: string;
  created_at: string;
  updated_at: string;
};
