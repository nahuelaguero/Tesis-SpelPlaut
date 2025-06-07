import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { ApiResponse } from "@/types";
import { verify } from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación y permisos de admin
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token de autenticación requerido",
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET || "secret") as {
        userId: string;
        rol: string;
      };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido",
        },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    if (decoded.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo los administradores pueden acceder",
        },
        { status: 403 }
      );
    }

    // Obtener todas las reservas con información del usuario y cancha
    const reservas = await Reserva.find({})
      .populate("usuario_id", "nombre_completo email telefono")
      .populate("cancha_id", "nombre ubicacion")
      .sort({ fecha_reserva: -1 });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas obtenidas exitosamente",
      data: { reservas },
    });
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
