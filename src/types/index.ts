import { ObjectId } from "mongodb";

export interface Usuario {
  _id?: ObjectId;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: "usuario" | "propietario_cancha" | "admin";
  contrasena_hash: string;
  autenticacion_2FA: boolean;
  codigo_2fa_email?: string;
  codigo_2fa_expira?: Date;
  preferencias: {
    tema?: "claro" | "oscuro";
    notificaciones?: boolean;
  };
  fecha_registro: Date;
  reset_password_token?: string;
  reset_password_expires?: Date;
  // Eliminado cancha_id - ahora usamos relación inversa (Cancha.propietario_id)
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
  dias_operativos: string[];
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
  duracion_horas: number;
  precio_total: number;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  fecha_reserva: Date;
  createdAt?: Date;
  updatedAt?: Date;
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
  twoFARequired?: boolean;
}

export interface PropietarioDashboard {
  canchas: {
    _id: string;
    nombre: string;
    tipo_cancha: string;
    ubicacion: string;
    precio_por_hora: number;
    disponible: boolean;
    total_reservas: number;
    ingresos_mes: number;
  }[];
  cancha_seleccionada?: {
    _id: string;
    nombre: string;
    tipo_cancha: string;
    ubicacion: string;
    precio_por_hora: number;
    disponible: boolean;
    total_reservas: number;
    ingresos_mes: number;
  };
  estadisticas_consolidadas: {
    total_canchas: number;
    reservas_hoy: number;
    reservas_semana: number;
    reservas_mes: number;
    ingresos_hoy: number;
    ingresos_semana: number;
    ingresos_mes: number;
    ocupacion_promedio: number;
  };
  estadisticas_cancha?: {
    reservas_hoy: number;
    reservas_semana: number;
    reservas_mes: number;
    ingresos_hoy: number;
    ingresos_semana: number;
    ingresos_mes: number;
    ocupacion_promedio: number;
  };
  reservas_recientes: {
    _id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    cancha_nombre: string;
    usuario: {
      nombre_completo: string;
      email: string;
    };
    estado: string;
    precio_total: number;
  }[];
}
