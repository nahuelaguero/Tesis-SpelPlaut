import { ObjectId } from "mongodb";

export interface Usuario {
  _id?: ObjectId;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: "usuario" | "admin";
  contrasena_hash: string;
  autenticacion_2FA: boolean;
  preferencias: {
    tema?: "claro" | "oscuro";
    notificaciones?: boolean;
  };
  fecha_registro: Date;
}

export interface Cancha {
  _id?: ObjectId;
  nombre: string;
  tipo: string;
  ubicacion: {
    direccion: string;
    ciudad: string;
  };
  imagenes: string[];
  precio_hora: number;
  horarios_disponibles: {
    dia: string;
    desde: string;
    hasta: string;
  }[];
  estado: "activo" | "inactivo";
}

export interface Reserva {
  _id?: ObjectId;
  usuario_id: ObjectId;
  cancha_id: ObjectId;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "confirmada" | "pendiente" | "cancelada";
  pagado: boolean;
  fecha_creacion: Date;
  notificaciones_enviadas: boolean;
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
