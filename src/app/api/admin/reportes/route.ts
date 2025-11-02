import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface ReporteData {
  ingresosMensuales: {
    mes: string;
    ingresos: number;
    reservas: number;
  }[];
  canchasMasPopulares: {
    _id: string;
    nombre: string;
    reservas: number;
    ingresos: number;
  }[];
  estadisticasHorarios: {
    _id: string;
    reservas: number;
  }[];
  resumenGeneral: {
    totalIngresos: number;
    totalReservas: number;
    promedioPorReserva: number;
    canchasMasActivas: number;
  };
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
          message: "Acceso denegado. Solo administradores pueden ver reportes",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "3m"; // 1m, 3m, 6m, 1y

    // Calcular fecha de inicio según el período
    const hoy = new Date();
    const fechaInicio = new Date();

    switch (periodo) {
      case "1m":
        fechaInicio.setMonth(hoy.getMonth() - 1);
        break;
      case "3m":
        fechaInicio.setMonth(hoy.getMonth() - 3);
        break;
      case "6m":
        fechaInicio.setMonth(hoy.getMonth() - 6);
        break;
      case "1y":
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
        break;
      default:
        fechaInicio.setMonth(hoy.getMonth() - 3);
    }

    // Obtener reservas del período (usando createdAt para el rango de fechas)
    const reservasDelPeriodo = await Reserva.find({
      createdAt: { $gte: fechaInicio },
      estado: { $in: ["confirmada", "completada"] },
    }).populate("cancha_id", "nombre tipo");

    // 1. RESUMEN GENERAL
    const totalReservas = reservasDelPeriodo.length;
    const totalIngresos = reservasDelPeriodo.reduce(
      (total, reserva) => total + reserva.precio_total,
      0
    );
    const promedioPorReserva =
      totalReservas > 0 ? totalIngresos / totalReservas : 0;

    // Canchas que tuvieron al menos una reserva
    const canchasActivas = new Set(
      reservasDelPeriodo.map((r) => r.cancha_id._id.toString())
    ).size;

    const resumenGeneral = {
      totalIngresos,
      totalReservas,
      promedioPorReserva,
      canchasMasActivas: canchasActivas,
    };

    // 2. INGRESOS MENSUALES
    const ingresosPorMes = new Map<
      string,
      { ingresos: number; reservas: number }
    >();
    const nombresMeses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    reservasDelPeriodo.forEach((reserva) => {
      const fecha = new Date(reserva.createdAt);
      const mesKey = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;

      if (!ingresosPorMes.has(mesKey)) {
        ingresosPorMes.set(mesKey, { ingresos: 0, reservas: 0 });
      }

      const mesData = ingresosPorMes.get(mesKey)!;
      mesData.ingresos += reserva.precio_total;
      mesData.reservas += 1;
    });

    const ingresosMensuales = Array.from(ingresosPorMes.entries())
      .map(([mes, data]) => ({
        mes,
        ingresos: data.ingresos,
        reservas: data.reservas,
      }))
      .sort((a, b) => {
        // Ordenar por fecha (más reciente primero)
        const [mesA, añoA] = a.mes.split(" ");
        const [mesB, añoB] = b.mes.split(" ");
        const fechaA = new Date(parseInt(añoA), nombresMeses.indexOf(mesA));
        const fechaB = new Date(parseInt(añoB), nombresMeses.indexOf(mesB));
        return fechaB.getTime() - fechaA.getTime();
      });

    // 3. CANCHAS MÁS POPULARES
    const canchaStats = new Map<
      string,
      { nombre: string; reservas: number; ingresos: number }
    >();

    reservasDelPeriodo.forEach((reserva) => {
      const cancha = reserva.cancha_id as { _id: string; nombre: string };
      const canchaId = cancha._id.toString();

      if (!canchaStats.has(canchaId)) {
        canchaStats.set(canchaId, {
          nombre: cancha.nombre,
          reservas: 0,
          ingresos: 0,
        });
      }

      const stats = canchaStats.get(canchaId)!;
      stats.reservas += 1;
      stats.ingresos += reserva.precio_total;
    });

    const canchasMasPopulares = Array.from(canchaStats.entries())
      .map(([_id, data]) => ({
        _id,
        nombre: data.nombre,
        reservas: data.reservas,
        ingresos: data.ingresos,
      }))
      .sort((a, b) => b.reservas - a.reservas);

    // 4. ESTADÍSTICAS DE HORARIOS
    const horarioStats = new Map<string, number>();

    reservasDelPeriodo.forEach((reserva) => {
      const hora = reserva.hora_inicio.split(":")[0]; // Extraer solo la hora
      horarioStats.set(hora, (horarioStats.get(hora) || 0) + 1);
    });

    const estadisticasHorarios = Array.from(horarioStats.entries())
      .map(([_id, reservas]) => ({ _id, reservas }))
      .sort((a, b) => b.reservas - a.reservas);

    const reporteData: ReporteData = {
      ingresosMensuales,
      canchasMasPopulares,
      estadisticasHorarios,
      resumenGeneral,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Reporte generado exitosamente",
        data: reporteData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al generar reporte:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
