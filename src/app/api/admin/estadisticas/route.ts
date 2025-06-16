import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import Cancha from "@/models/Cancha";
import Reserva from "@/models/Reserva";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface EstadisticasAdmin {
  total_usuarios: number;
  total_canchas: number;
  total_reservas: number;
  reservas_hoy: number;
  ingresos_mes: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación y permisos de admin
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

    if (user.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Acceso denegado. Solo administradores pueden ver estas estadísticas",
        },
        { status: 403 }
      );
    }

    // Obtener estadísticas básicas
    const [totalUsuarios, totalCanchas, totalReservas] = await Promise.all([
      Usuario.countDocuments(),
      Cancha.countDocuments(),
      Reserva.countDocuments(),
    ]);

    // Reservas de hoy (usando el campo fecha que es string YYYY-MM-DD)
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    const reservasHoy = await Reserva.countDocuments({
      fecha: fechaHoy,
    });

    // Ingresos del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const reservasMes = await Reserva.find({
      createdAt: { $gte: inicioMes },
      estado: { $in: ["confirmada", "completada"] },
    });

    const ingresosMes = reservasMes.reduce(
      (total, reserva) => total + reserva.precio_total,
      0
    );

    const estadisticas: EstadisticasAdmin = {
      total_usuarios: totalUsuarios,
      total_canchas: totalCanchas,
      total_reservas: totalReservas,
      reservas_hoy: reservasHoy,
      ingresos_mes: ingresosMes,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: estadisticas,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener estadísticas de admin:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
