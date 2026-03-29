import mongoose from "mongoose";

const resenaSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    cancha_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cancha",
      required: true,
    },
    calificacion: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comentario: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

// Un usuario solo puede dejar una reseña por cancha
resenaSchema.index({ usuario_id: 1, cancha_id: 1 }, { unique: true });

export default mongoose.models.Resena ||
  mongoose.model("Resena", resenaSchema, "resenas");
