import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import Cancha from "@/models/Cancha";
import { ApiResponse } from "@/types";

export async function GET() {
  try {
    await connectDB();

    // Obtener estadísticas básicas
    const [totalUsuarios, totalCanchas] = await Promise.all([
      Usuario.countDocuments({}),
      Cancha.countDocuments({}),
    ]);

    // Por ahora usamos datos de prueba para reservas e ingresos
    // Cuando tengamos el modelo de Reserva, podemos obtener datos reales
    const estadisticas = {
      total_usuarios: totalUsuarios,
      total_canchas: totalCanchas,
      total_reservas: 0, // TODO: Cuando tengamos el modelo Reserva
      reservas_hoy: 0, // TODO: Cuando tengamos el modelo Reserva
      ingresos_mes: 0, // TODO: Cuando tengamos el modelo Reserva
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Estadísticas obtenidas exitosamente",
      data: estadisticas,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
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
