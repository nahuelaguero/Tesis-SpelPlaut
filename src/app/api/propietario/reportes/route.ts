import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface ReporteData {
  ingresosMensuales: { mes: string; ingresos: number; reservas: number }[];
  canchasMasPopulares: {
    _id: string;
    nombre: string;
    reservas: number;
    ingresos: number;
  }[];
  estadisticasHorarios: { _id: string; reservas: number }[];
  resumenGeneral: {
    totalIngresos: number;
    totalReservas: number;
    promedioPorReserva: number;
    canchasMasActivas: number;
  };
}

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Acceso denegado. Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (user.rol !== "propietario_cancha") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Solo propietarios pueden ver este reporte." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "3m";

    const fechaInicio = new Date();
    switch (periodo) {
      case "1m": fechaInicio.setMonth(fechaInicio.getMonth() - 1); break;
      case "6m": fechaInicio.setMonth(fechaInicio.getMonth() - 6); break;
      case "1y": fechaInicio.setFullYear(fechaInicio.getFullYear() - 1); break;
      default: fechaInicio.setMonth(fechaInicio.getMonth() - 3);
    }

    // Solo canchas del propietario
    const canchasPropias = await Cancha.find({ propietario_id: user.userId })
      .select("_id nombre")
      .lean();
    const canchaIds = canchasPropias.map((c) => c._id);

    if (canchaIds.length === 0) {
      const empty: ReporteData = {
        ingresosMensuales: [],
        canchasMasPopulares: [],
        estadisticasHorarios: [],
        resumenGeneral: {
          totalIngresos: 0,
          totalReservas: 0,
          promedioPorReserva: 0,
          canchasMasActivas: 0,
        },
      };
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Sin canchas asignadas",
        data: empty,
      });
    }

    const reservas = await Reserva.find({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: fechaInicio },
      estado: { $in: ["confirmada", "completada"] },
    }).populate("cancha_id", "nombre");

    const totalReservas = reservas.length;
    const totalIngresos = reservas.reduce((s, r) => s + r.precio_total, 0);
    const canchasActivas = new Set(
      reservas.map((r) => r.cancha_id?._id?.toString()).filter(Boolean)
    ).size;

    const ingresosPorMes = new Map<string, { ingresos: number; reservas: number }>();
    reservas.forEach((r) => {
      const f = new Date(r.createdAt);
      const key = `${NOMBRES_MESES[f.getMonth()]} ${f.getFullYear()}`;
      const data = ingresosPorMes.get(key) || { ingresos: 0, reservas: 0 };
      data.ingresos += r.precio_total;
      data.reservas += 1;
      ingresosPorMes.set(key, data);
    });
    const ingresosMensuales = Array.from(ingresosPorMes.entries())
      .map(([mes, d]) => ({ mes, ingresos: d.ingresos, reservas: d.reservas }))
      .sort((a, b) => {
        const [ma, ya] = a.mes.split(" ");
        const [mb, yb] = b.mes.split(" ");
        return new Date(+yb, NOMBRES_MESES.indexOf(mb)).getTime() -
               new Date(+ya, NOMBRES_MESES.indexOf(ma)).getTime();
      });

    const canchaStats = new Map<string, { nombre: string; reservas: number; ingresos: number }>();
    reservas.forEach((r) => {
      const c = r.cancha_id as { _id: string; nombre: string } | null;
      if (!c) return;
      const id = c._id.toString();
      const s = canchaStats.get(id) || { nombre: c.nombre, reservas: 0, ingresos: 0 };
      s.reservas += 1;
      s.ingresos += r.precio_total;
      canchaStats.set(id, s);
    });
    const canchasMasPopulares = Array.from(canchaStats.entries())
      .map(([_id, d]) => ({ _id, nombre: d.nombre, reservas: d.reservas, ingresos: d.ingresos }))
      .sort((a, b) => b.reservas - a.reservas);

    const horarioStats = new Map<string, number>();
    reservas.forEach((r) => {
      const h = r.hora_inicio.split(":")[0];
      horarioStats.set(h, (horarioStats.get(h) || 0) + 1);
    });
    const estadisticasHorarios = Array.from(horarioStats.entries())
      .map(([_id, n]) => ({ _id, reservas: n }))
      .sort((a, b) => b.reservas - a.reservas);

    const data: ReporteData = {
      ingresosMensuales,
      canchasMasPopulares,
      estadisticasHorarios,
      resumenGeneral: {
        totalIngresos,
        totalReservas,
        promedioPorReserva: totalReservas > 0 ? totalIngresos / totalReservas : 0,
        canchasMasActivas: canchasActivas,
      },
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reporte generado exitosamente",
      data,
    });
  } catch (error) {
    console.error("Error reporte propietario:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
