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
      unique: true,
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
      enum: ["usuario", "admin"],
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
  },
  {
    timestamps: true,
  }
);

// Crear índices
usuarioSchema.index({ email: 1 });

export default mongoose.models.Usuario ||
  mongoose.model<Usuario>("Usuario", usuarioSchema);
