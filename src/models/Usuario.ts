import mongoose from "mongoose";
import { Usuario } from "@/types";

const usuarioSchema = new mongoose.Schema<Usuario>(
  {
    nombre_completo: {
      type: String,
      required: [true, "El nombre completo es requerido"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      lowercase: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
    },
    rol: {
      type: String,
      enum: ["usuario", "propietario_cancha", "admin"],
      default: "usuario",
    },
    contrasena_hash: {
      type: String,
      required: [true, "La contraseña es requerida"],
    },
    autenticacion_2FA: {
      type: Boolean,
      default: false,
    },
    preferencias: {
      tema: {
        type: String,
        enum: ["claro", "oscuro"],
        default: "claro",
      },
      notificaciones: {
        type: Boolean,
        default: true,
      },
    },
    fecha_registro: {
      type: Date,
      default: Date.now,
    },
    reset_password_token: {
      type: String,
      default: null,
    },
    reset_password_expires: {
      type: Date,
      default: null,
    },
    cancha_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cancha",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Crear índices únicos
usuarioSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.Usuario ||
  mongoose.model<Usuario>("Usuario", usuarioSchema);
