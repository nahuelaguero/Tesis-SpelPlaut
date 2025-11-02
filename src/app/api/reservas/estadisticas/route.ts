import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import Usuario from "@/models/Usuario";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface EstadisticasReservas {
  resumen_general: {
    total_reservas: number;
    reservas_confirmadas: number;
    reservas_pendientes: number;
    reservas_canceladas: number;
    ingresos_totales: number;
    ingresos_mes_actual: number;
  };
  estadisticas_por_mes: Array<{
    mes: string;
    año: number;
    total_reservas: number;
    ingresos: number;
    reservas_confirmadas: number;
    reservas_canceladas: number;
  }>;
  reservas_por_cancha: Array<{
    cancha_id: string;
    nombre_cancha: string;
    tipo_cancha: string;
    total_reservas: number;
    ingresos: number;
    ocupacion_promedio: number;
  }>;
  reservas_por_estado: Array<{
    estado: string;
    cantidad: number;
    porcentaje: number;
  }>;
  proximas_reservas: Array<{
    _id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    cancha: {
      nombre: string;
      tipo: string;
    };
    usuario: {
      nombre_completo: string;
      email: string;
    };
    estado: string;
    precio_total: number;
  }>;
  tendencias:
    | {
        crecimiento_mensual: number;
        dia_mas_popular: string;
        hora_mas_popular: string;
        cancha_mas_reservada: string;
      }
    | Record<string, never>;
}

// GET /api/reservas/estadisticas?periodo=30&cancha_id=xxx
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación (solo admin puede ver estadísticas generales)
    const userPayload = requireAuth(request);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Debes iniciar sesión",
        },
        { status: 401 }
      );
    }

    // Obtener usuario completo de la base de datos
    const user = await Usuario.findById(userPayload.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodo = parseInt(searchParams.get("periodo") || "30"); // días
    const cancha_id = searchParams.get("cancha_id"); // filtro opcional por cancha
    const incluir_tendencias = searchParams.get("tendencias") === "true";

    // Calcular fechas
    const hoy = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - periodo);

    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Construir filtro base
    const filtroBase: Record<string, unknown> = {
      fecha_reserva: { $gte: fechaInicio },
    };

    // Si se especifica cancha_id y el usuario no es admin
    if (cancha_id) {
      filtroBase.cancha_id = cancha_id;
    } else if (user.rol === "propietario_cancha") {
      // Si es propietario, obtener sus canchas
      const canchasDelPropietario = await Cancha.find({
        propietario_id: user._id,
      });
      const canchaIds = canchasDelPropietario.map((c) => c._id);
      if (canchaIds.length > 0) {
        filtroBase.cancha_id = { $in: canchaIds };
      }
    }

    // Obtener reservas del período
    const reservasDelPeriodo = await Reserva.find(filtroBase)
      .populate("cancha_id", "nombre tipo_cancha precio_por_hora")
      .populate("usuario_id", "nombre_completo email")
      .sort({ fecha_reserva: -1 });

    // Obtener todas las reservas para resumen general
    let filtroTodasReservas = {};
    if (cancha_id) {
      filtroTodasReservas = { cancha_id };
    } else if (user.rol === "propietario_cancha") {
      const canchasDelPropietario = await Cancha.find({
        propietario_id: user._id,
      });
      const canchaIds = canchasDelPropietario.map((c) => c._id);
      if (canchaIds.length > 0) {
        filtroTodasReservas = { cancha_id: { $in: canchaIds } };
      }
    }

    const todasLasReservas = await Reserva.find(filtroTodasReservas);

    // Reservas del mes actual
    const reservasMesActual = await Reserva.find({
      ...filtroBase,
      fecha_reserva: { $gte: inicioMesActual },
    });

    // 1. RESUMEN GENERAL
    const reservasConfirmadas = todasLasReservas.filter(
      (r) => r.estado === "confirmada" || r.estado === "completada"
    );
    const ingresosTotales = reservasConfirmadas.reduce(
      (total, r) => total + r.precio_total,
      0
    );
    const ingresosMesActual = reservasMesActual
      .filter((r) => r.estado === "confirmada" || r.estado === "completada")
      .reduce((total, r) => total + r.precio_total, 0);

    const resumenGeneral = {
      total_reservas: todasLasReservas.length,
      reservas_confirmadas: todasLasReservas.filter(
        (r) => r.estado === "confirmada" || r.estado === "completada"
      ).length,
      reservas_pendientes: todasLasReservas.filter(
        (r) => r.estado === "pendiente"
      ).length,
      reservas_canceladas: todasLasReservas.filter(
        (r) => r.estado === "cancelada"
      ).length,
      ingresos_totales: ingresosTotales,
      ingresos_mes_actual: ingresosMesActual,
    };

    // 2. ESTADÍSTICAS POR MES (últimos 6 meses)
    const estadisticasPorMes = [];
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

    for (let i = 5; i >= 0; i--) {
      const fechaMes = new Date();
      fechaMes.setMonth(fechaMes.getMonth() - i);

      const inicioMes = new Date(
        fechaMes.getFullYear(),
        fechaMes.getMonth(),
        1
      );
      const finMes = new Date(
        fechaMes.getFullYear(),
        fechaMes.getMonth() + 1,
        0
      );

      const reservasDelMes = await Reserva.find({
        ...filtroBase,
        fecha_reserva: {
          $gte: inicioMes,
          $lte: finMes,
        },
      });

      const confirmadas = reservasDelMes.filter(
        (r) => r.estado === "confirmada" || r.estado === "completada"
      );

      estadisticasPorMes.push({
        mes: nombresMeses[fechaMes.getMonth()],
        año: fechaMes.getFullYear(),
        total_reservas: reservasDelMes.length,
        ingresos: confirmadas.reduce((total, r) => total + r.precio_total, 0),
        reservas_confirmadas: confirmadas.length,
        reservas_canceladas: reservasDelMes.filter(
          (r) => r.estado === "cancelada"
        ).length,
      });
    }

    // 3. RESERVAS POR CANCHA
    const reservasPorCancha = new Map();
    reservasDelPeriodo.forEach((reserva) => {
      const cancha = reserva.cancha_id as {
        _id: { toString(): string };
        nombre: string;
        tipo_cancha: string;
      };
      const key = cancha._id.toString();

      if (!reservasPorCancha.has(key)) {
        reservasPorCancha.set(key, {
          cancha_id: key,
          nombre_cancha: cancha.nombre,
          tipo_cancha: cancha.tipo_cancha,
          total_reservas: 0,
          ingresos: 0,
          reservas_confirmadas: 0,
        });
      }

      const stats = reservasPorCancha.get(key);
      stats.total_reservas++;
      if (reserva.estado === "confirmada" || reserva.estado === "completada") {
        stats.ingresos += reserva.precio_total;
        stats.reservas_confirmadas++;
      }
    });

    const estadisticasPorCancha = Array.from(reservasPorCancha.values()).map(
      (stats) => ({
        ...stats,
        ocupacion_promedio:
          Math.round((stats.reservas_confirmadas / periodo) * 100) / 100, // reservas por día
      })
    );

    // 4. RESERVAS POR ESTADO
    const estadosCounts = {
      pendiente: todasLasReservas.filter((r) => r.estado === "pendiente")
        .length,
      confirmada: todasLasReservas.filter((r) => r.estado === "confirmada")
        .length,
      cancelada: todasLasReservas.filter((r) => r.estado === "cancelada")
        .length,
      completada: todasLasReservas.filter((r) => r.estado === "completada")
        .length,
    };

    const reservasPorEstado = Object.entries(estadosCounts).map(
      ([estado, cantidad]) => ({
        estado,
        cantidad,
        porcentaje:
          todasLasReservas.length > 0
            ? Math.round((cantidad / todasLasReservas.length) * 100)
            : 0,
      })
    );

    // 5. PRÓXIMAS RESERVAS (próximos 7 días)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const proxSemana = new Date();
    proxSemana.setDate(proxSemana.getDate() + 7);

    const proximasReservas = await Reserva.find({
      ...filtroBase,
      fecha: {
        $gte: manana.toISOString().split("T")[0],
        $lte: proxSemana.toISOString().split("T")[0],
      },
      estado: { $in: ["pendiente", "confirmada"] },
    })
      .populate("cancha_id", "nombre tipo_cancha")
      .populate("usuario_id", "nombre_completo email")
      .sort({ fecha: 1, hora_inicio: 1 })
      .limit(10);

    const proximasReservasFormateadas = proximasReservas.map((reserva) => ({
      _id: reserva._id.toString(),
      fecha: reserva.fecha,
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      cancha: {
        nombre: (reserva.cancha_id as { nombre: string; tipo_cancha: string })
          .nombre,
        tipo: (reserva.cancha_id as { nombre: string; tipo_cancha: string })
          .tipo_cancha,
      },
      usuario: {
        nombre_completo: (
          reserva.usuario_id as { nombre_completo: string; email: string }
        ).nombre_completo,
        email: (
          reserva.usuario_id as { nombre_completo: string; email: string }
        ).email,
      },
      estado: reserva.estado,
      precio_total: reserva.precio_total,
    }));

    // 6. TENDENCIAS (opcional)
    let tendencias = {};
    if (incluir_tendencias) {
      // Calcular crecimiento mensual
      const mesAnterior = estadisticasPorMes[estadisticasPorMes.length - 2];
      const mesActual = estadisticasPorMes[estadisticasPorMes.length - 1];
      const crecimientoMensual =
        mesAnterior?.total_reservas > 0
          ? Math.round(
              ((mesActual.total_reservas - mesAnterior.total_reservas) /
                mesAnterior.total_reservas) *
                100
            )
          : 0;

      // Día más popular
      const reservasPorDia = new Map();
      const diasSemana = [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
      ];

      reservasDelPeriodo.forEach((reserva) => {
        const fecha = new Date(reserva.fecha);
        const dia = diasSemana[fecha.getDay()];
        reservasPorDia.set(dia, (reservasPorDia.get(dia) || 0) + 1);
      });

      const diaMasPopular =
        Array.from(reservasPorDia.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || "N/A";

      // Hora más popular
      const reservasPorHora = new Map();
      reservasDelPeriodo.forEach((reserva) => {
        const hora = reserva.hora_inicio.split(":")[0];
        reservasPorHora.set(hora, (reservasPorHora.get(hora) || 0) + 1);
      });

      const horaMasPopular =
        Array.from(reservasPorHora.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] + ":00" || "N/A";

      // Cancha más reservada
      const canchaMasReservada =
        estadisticasPorCancha.sort(
          (a, b) => b.total_reservas - a.total_reservas
        )[0]?.nombre_cancha || "N/A";

      tendencias = {
        crecimiento_mensual: crecimientoMensual,
        dia_mas_popular: diaMasPopular,
        hora_mas_popular: horaMasPopular,
        cancha_mas_reservada: canchaMasReservada,
      };
    }

    const estadisticas: EstadisticasReservas = {
      resumen_general: resumenGeneral,
      estadisticas_por_mes: estadisticasPorMes,
      reservas_por_cancha: estadisticasPorCancha,
      reservas_por_estado: reservasPorEstado,
      proximas_reservas: proximasReservasFormateadas,
      tendencias,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: { estadisticas },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
