import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autorizado - Sin token",
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as { userId: string; email: string; rol: string };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido o expirado",
        },
        { status: 401 }
      );
    }

    await connectDB();

    console.log(
      `🔍 Buscando reservas para usuario: ${decoded.userId} (${decoded.email})`
    );

    // Buscar las reservas del usuario
    const reservas = await Reserva.find({ usuario_id: decoded.userId })
      .populate("cancha_id", "nombre tipo ubicacion precio_por_hora")
      .sort({ fecha_reserva: -1, hora_inicio: 1 });

    console.log(`📊 Reservas encontradas: ${reservas.length}`);
    if (reservas.length > 0) {
      console.log("📝 Primeras reservas:", reservas.slice(0, 2));
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas obtenidas exitosamente",
      data: {
        reservas,
        total: reservas.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
        data: null,
      },
      { status: 500 }
    );
  }
}
