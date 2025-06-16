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
      unique: true,
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
    codigo_2fa_email: {
      type: String,
      default: null,
    },
    codigo_2fa_expira: {
      type: Date,
      default: null,
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
    // Eliminado cancha_id - ahora usamos la relación inversa
    // Las canchas tienen propietario_id que apunta al usuario
  },
  {
    timestamps: true,
  }
);

// El índice único ya está definido en el schema

export default mongoose.models.Usuario ||
  mongoose.model<Usuario>("Usuario", usuarioSchema, "users");
