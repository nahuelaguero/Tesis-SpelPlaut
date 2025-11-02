import mongoose from "mongoose";
import { Cancha } from "@/types";

const canchaSchema = new mongoose.Schema<Cancha>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la cancha es requerido"],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, "La descripción es requerida"],
      trim: true,
    },
    tipo_cancha: {
      type: String,
      required: [true, "El tipo de cancha es requerido"],
      trim: true,
    },
    ubicacion: {
      type: String,
      required: [true, "La ubicación es requerida"],
      trim: true,
    },
    imagenes: [
      {
        type: String,
        trim: true,
      },
    ],
    precio_por_hora: {
      type: Number,
      required: [true, "El precio por hora es requerido"],
      min: [0, "El precio no puede ser negativo"],
    },
    capacidad_jugadores: {
      type: Number,
      required: [true, "La capacidad de jugadores es requerida"],
      min: [1, "La capacidad debe ser al menos 1"],
    },
    horario_apertura: {
      type: String,
      required: [true, "El horario de apertura es requerido"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Formato de hora inválido (HH:MM)",
      ],
    },
    horario_cierre: {
      type: String,
      required: [true, "El horario de cierre es requerido"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Formato de hora inválido (HH:MM)",
      ],
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    dias_operativos: {
      type: [String],
      enum: [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ],
      default: [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ],
    },
    propietario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El propietario de la cancha es requerido"],
    },
    disponibilidad: [
      {
        fecha: {
          type: String,
          required: true,
        },
        disponible: {
          type: Boolean,
          required: true,
          default: true,
        },
        motivo: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Crear índices
canchaSchema.index({ tipo_cancha: 1, disponible: 1 });
canchaSchema.index({ ubicacion: 1 });

export default mongoose.models.Cancha ||
  mongoose.model<Cancha>("Cancha", canchaSchema, "canchas");
