import mongoose, { Schema } from "mongoose";
import type { Reserva } from "@/types";

const ReservaSchema = new Schema<Reserva>(
  {
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    cancha_id: {
      type: Schema.Types.ObjectId,
      ref: "Cancha",
      required: true,
    },
    fecha: {
      type: String,
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
      max: 24,
    },
    precio_total: {
      type: Number,
      required: true,
      min: 0,
    },
    // Desglose de los precios aplicados por hora (para auditoría y transparencia)
    desglose_precios: [
      {
        hora: { type: String, required: true },
        precio: { type: Number, required: true },
      },
    ],
    estado: {
      type: String,
      enum: [
        "pendiente",
        "pendiente_aprobacion",
        "confirmada",
        "cancelada",
        "rechazada",
        "completada",
      ],
      default: "pendiente_aprobacion",
    },
    metodo_pago: {
      type: String,
      default: "efectivo",
      trim: true,
    },
    pagado: {
      type: Boolean,
      default: false,
    },
    notas: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    numero_jugadores: {
      type: Number,
      min: 1,
    },
    motivo_rechazo: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    aprobada_por_propietario: {
      type: Boolean,
      default: null,
    },
    fecha_decision: {
      type: Date,
      default: null,
    },
    fecha_aprobacion: {
      type: Date,
    },
    fecha_rechazo: {
      type: Date,
    },
    fecha_reserva: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas
ReservaSchema.index({ cancha_id: 1, fecha: 1 });
ReservaSchema.index({ usuario_id: 1, fecha_reserva: -1 });
ReservaSchema.index({ estado: 1 });
// Índice compuesto optimizado para verificar disponibilidad
ReservaSchema.index({ cancha_id: 1, fecha_reserva: 1, estado: 1 });
// Índice compuesto para verificación de superposición (usa campo fecha string)
ReservaSchema.index({ cancha_id: 1, fecha: 1, estado: 1 });
ReservaSchema.index({ cancha_id: 1, estado: 1, createdAt: -1 });

const ReservaModel =
  mongoose.models.Reserva || mongoose.model<Reserva>("Reserva", ReservaSchema);

export default ReservaModel;
