import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Resena from "@/models/Resena";
import "@/models/Usuario"; // Registrar schema para populate
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const cancha_id = new URL(request.url).searchParams.get("cancha_id");
    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de cancha inválido." },
        { status: 400 }
      );
    }

    const resenas = await Resena.find({ cancha_id })
      .populate("usuario_id", "nombre_completo")
      .sort({ createdAt: -1 })
      .lean();

    const total = resenas.length;
    const promedio =
      total > 0
        ? Math.round((resenas.reduce((sum, r) => sum + r.calificacion, 0) / total) * 10) / 10
        : null;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reseñas obtenidas.",
      data: { resenas, total, promedio },
    });
  } catch (error) {
    console.error("Error obteniendo reseñas:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Debes iniciar sesión para dejar una reseña." },
        { status: 401 }
      );
    }

    const { cancha_id, calificacion, comentario } = await request.json();

    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de cancha inválido." },
        { status: 400 }
      );
    }

    const cal = Number(calificacion);
    if (!cal || cal < 1 || cal > 5 || !Number.isInteger(cal)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La calificación debe ser un número entero del 1 al 5." },
        { status: 400 }
      );
    }

    // Strip HTML tags to prevent stored XSS
    const sanitizedComment = (comentario?.trim().slice(0, 500) || "").replace(/<[^>]*>/g, "");

    const resena = await Resena.findOneAndUpdate(
      { usuario_id: auth.userId, cancha_id },
      {
        calificacion: cal,
        comentario: sanitizedComment,
      },
      { upsert: true, new: true }
    ).populate("usuario_id", "nombre_completo");

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Reseña guardada exitosamente.",
        data: { resena },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error guardando reseña:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
