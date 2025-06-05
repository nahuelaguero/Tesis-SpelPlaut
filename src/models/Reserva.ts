import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReserva extends Document {
  _id: Types.ObjectId;
  cancha_id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  fecha_reserva: Date;
  hora_inicio: string;
  hora_fin: string;
  duracion_horas: number;
  precio_total: number;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  metodo_pago?: "efectivo" | "transferencia" | "tarjeta";
  pagado: boolean;
  notas?: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

const ReservaSchema = new Schema<IReserva>(
  {
    cancha_id: {
      type: Schema.Types.ObjectId,
      ref: "Cancha",
      required: true,
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    fecha_reserva: {
      type: Date,
      required: true,
    },
    hora_inicio: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    hora_fin: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    duracion_horas: {
      type: Number,
      required: true,
      min: 0.5,
      max: 12,
    },
    precio_total: {
      type: Number,
      required: true,
      min: 0,
    },
    estado: {
      type: String,
      enum: ["pendiente", "confirmada", "cancelada", "completada"],
      default: "pendiente",
    },
    metodo_pago: {
      type: String,
      enum: ["efectivo", "transferencia", "tarjeta"],
    },
    pagado: {
      type: Boolean,
      default: false,
    },
    notas: {
      type: String,
      maxlength: 500,
    },
    fecha_creacion: {
      type: Date,
      default: Date.now,
    },
    fecha_actualizacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
    },
  }
);

// Índices para optimizar consultas
ReservaSchema.index({ cancha_id: 1, fecha_reserva: 1 });
ReservaSchema.index({ usuario_id: 1, fecha_reserva: -1 });
ReservaSchema.index({ estado: 1 });
ReservaSchema.index({ fecha_reserva: 1, hora_inicio: 1 });

// Validación: no puede haber reservas superpuestas para la misma cancha
ReservaSchema.index(
  { cancha_id: 1, fecha_reserva: 1, hora_inicio: 1, hora_fin: 1 },
  {
    unique: true,
    partialFilterExpression: {
      estado: { $ne: "cancelada" },
    },
  }
);

// Middleware para actualizar fecha_actualizacion
ReservaSchema.pre("save", function (next) {
  this.fecha_actualizacion = new Date();
  next();
});

// Middleware para validar que la hora de fin sea posterior a la hora de inicio
ReservaSchema.pre("save", function (next) {
  const inicio = this.hora_inicio.split(":").map(Number);
  const fin = this.hora_fin.split(":").map(Number);

  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const finMinutos = fin[0] * 60 + fin[1];

  if (finMinutos <= inicioMinutos) {
    next(new Error("La hora de fin debe ser posterior a la hora de inicio"));
  } else {
    next();
  }
});

// Middleware para calcular duración automáticamente
ReservaSchema.pre("save", function (next) {
  const inicio = this.hora_inicio.split(":").map(Number);
  const fin = this.hora_fin.split(":").map(Number);

  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const finMinutos = fin[0] * 60 + fin[1];

  this.duracion_horas = (finMinutos - inicioMinutos) / 60;
  next();
});

const Reserva =
  mongoose.models.Reserva || mongoose.model<IReserva>("Reserva", ReservaSchema);

export default Reserva;
