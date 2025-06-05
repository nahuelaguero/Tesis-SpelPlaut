import mongoose from "mongoose";
import { Cancha } from "@/types";

const canchaSchema = new mongoose.Schema<Cancha>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la cancha es requerido"],
      trim: true,
    },
    tipo: {
      type: String,
      required: [true, "El tipo de cancha es requerido"],
      trim: true,
    },
    ubicacion: {
      direccion: {
        type: String,
        required: [true, "La dirección es requerida"],
        trim: true,
      },
      ciudad: {
        type: String,
        required: [true, "La ciudad es requerida"],
        trim: true,
      },
    },
    imagenes: [
      {
        type: String,
        trim: true,
      },
    ],
    precio_hora: {
      type: Number,
      required: [true, "El precio por hora es requerido"],
      min: [0, "El precio no puede ser negativo"],
    },
    horarios_disponibles: [
      {
        dia: {
          type: String,
          required: true,
          enum: [
            "lunes",
            "martes",
            "miércoles",
            "jueves",
            "viernes",
            "sábado",
            "domingo",
          ],
        },
        desde: {
          type: String,
          required: true,
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Formato de hora inválido (HH:MM)",
          ],
        },
        hasta: {
          type: String,
          required: true,
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Formato de hora inválido (HH:MM)",
          ],
        },
      },
    ],
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },
  },
  {
    timestamps: true,
  }
);

// Crear índices
canchaSchema.index({ tipo: 1, estado: 1 });
canchaSchema.index({ "ubicacion.ciudad": 1 });

export default mongoose.models.Cancha ||
  mongoose.model<Cancha>("Cancha", canchaSchema);
