import { ObjectId } from "mongodb";

export interface Usuario {
  _id?: ObjectId;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: "usuario" | "propietario_cancha" | "admin";
  contrasena_hash: string;
  autenticacion_2FA: boolean;
  preferencias: {
    tema?: "claro" | "oscuro";
    notificaciones?: boolean;
  };
  fecha_registro: Date;
  reset_password_token?: string;
  reset_password_expires?: Date;
  cancha_id?: ObjectId; // Solo para propietarios de cancha
}

export interface Cancha {
  _id?: ObjectId;
  nombre: string;
  descripcion: string;
  tipo_cancha: string;
  ubicacion: string;
  imagenes: string[];
  precio_por_hora: number;
  capacidad_jugadores: number;
  horario_apertura: string;
  horario_cierre: string;
  disponible: boolean;
  propietario_id: ObjectId;
  disponibilidad?: {
    fecha: string;
    disponible: boolean;
    motivo?: string; // Razón de la no disponibilidad
  }[];
}

export interface Reserva {
  _id?: ObjectId;
  usuario_id: ObjectId;
  cancha_id: ObjectId;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  fecha_reserva: Date;
}

export interface Pago {
  _id?: ObjectId;
  reserva_id: ObjectId;
  usuario_id: ObjectId;
  monto: number;
  metodo_pago: string;
  estado: "pagado" | "reembolsado";
  fecha_pago: Date;
}

export interface Feedback {
  _id?: ObjectId;
  usuario_id: ObjectId;
  tipo: "sugerencia" | "reclamo";
  mensaje: string;
  fecha_envio: Date;
  resuelto: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre_completo: string;
  email: string;
  telefono: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
