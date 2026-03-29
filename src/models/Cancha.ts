import mongoose from "mongoose";
import { Cancha } from "@/types";
import { validatePricingRules } from "@/lib/pricing";

const precioHorarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
    },
    dias_semana: {
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
      required: true,
      default: [],
    },
    hora_inicio: {
      type: String,
      required: true,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Formato de hora inválido (HH:MM)",
      ],
    },
    hora_fin: {
      type: String,
      required: true,
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Formato de hora inválido (HH:MM)",
      ],
    },
    precio_por_hora: {
      type: Number,
      required: true,
      min: [0, "El precio no puede ser negativo"],
    },
  },
  { _id: true }
);

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
    precios_por_horario: {
      type: [precioHorarioSchema],
      default: [],
      validate: {
        validator: function (
          this: { intervalo_reserva_minutos?: number },
          value: Cancha["precios_por_horario"]
        ) {
          const validationError = validatePricingRules(
            value || [],
            this.intervalo_reserva_minutos
          );
          return !validationError;
        },
        message:
          "Las reglas de precios tienen horarios invalidos o se superponen.",
      },
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
    intervalo_reserva_minutos: {
      type: Number,
      default: 60,
      min: [15, "El intervalo minimo es 15 minutos"],
      max: [180, "El intervalo maximo es 180 minutos"],
      validate: {
        validator: (value: number) => value % 15 === 0,
        message: "El intervalo de reserva debe ser multiplo de 15 minutos",
      },
    },
    aprobacion_automatica: {
      type: Boolean,
      default: true,
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
canchaSchema.index({ disponible: 1, createdAt: -1 });
canchaSchema.index({ propietario_id: 1, createdAt: -1 });

export default mongoose.models.Cancha ||
  mongoose.model<Cancha>("Cancha", canchaSchema, "canchas");
