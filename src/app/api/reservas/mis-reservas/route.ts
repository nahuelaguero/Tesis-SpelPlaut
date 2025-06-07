import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Debes iniciar sesión",
        },
        { status: 401 }
      );
    }

    console.log(
      `🔍 Buscando reservas para usuario: ${user.userId} (${user.email})`
    );

    // Obtener las reservas del usuario actual
    const reservas = await Reserva.find({ usuario_id: user.userId })
      .populate("cancha_id", "nombre tipo ubicacion precio_por_hora")
      .sort({ fecha_reserva: -1, hora_inicio: 1 });

    console.log(`📊 Reservas encontradas: ${reservas.length}`);
    console.log("📝 Primeras reservas:", reservas.slice(0, 2));

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas obtenidas exitosamente",
      data: { reservas },
    });
  } catch (error) {
    console.error("Error al obtener reservas del usuario:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
