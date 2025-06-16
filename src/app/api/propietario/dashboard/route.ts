import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import Usuario from "@/models/Usuario";
import { requireAuth } from "@/lib/auth";
import { ApiResponse, PropietarioDashboard } from "@/types";

interface PopulatedReserva {
  _id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
  estado: string;
  createdAt: Date;
  duracion_horas: number;
  cancha_id: {
    _id: string;
    nombre: string;
  };
  usuario_id: {
    nombre_completo: string;
    email: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación
    const userPayload = requireAuth(request);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autenticado.",
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
          message: "Usuario no encontrado.",
        },
        { status: 404 }
      );
    }

    if (user.rol !== "propietario_cancha") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Acceso denegado. Solo propietarios de cancha pueden acceder",
        },
        { status: 403 }
      );
    }

    // Obtener todas las canchas del propietario
    const canchasDelPropietario = await Cancha.find({
      propietario_id: user._id,
    });

    if (canchasDelPropietario.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No tienes canchas asignadas. Contacta al administrador",
        },
        { status: 400 }
      );
    }

    // Obtener parámetro de cancha específica (opcional)
    const { searchParams } = new URL(request.url);
    const canchaIdSeleccionada = searchParams.get("cancha_id");

    // Calcular fechas para estadísticas
    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );
    const finHoy = new Date(inicioHoy);
    finHoy.setDate(finHoy.getDate() + 1);

    const inicioSemana = new Date(inicioHoy);
    inicioSemana.setDate(inicioHoy.getDate() - inicioHoy.getDay());

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // IDs de todas las canchas del propietario
    const canchaIds = canchasDelPropietario.map((c) => c._id);

    // Obtener todas las reservas de las canchas del propietario
    const todasLasReservas = (await Reserva.find({
      cancha_id: { $in: canchaIds },
    })
      .populate("usuario_id", "nombre_completo email")
      .populate("cancha_id", "nombre")) as PopulatedReserva[];

    // ESTADÍSTICAS CONSOLIDADAS (todas las canchas)
    const reservasHoyConsolidadas = await Reserva.countDocuments({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: inicioHoy, $lt: finHoy },
    });

    const reservasSemanaConsolidadas = await Reserva.countDocuments({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: inicioSemana },
    });

    const reservasMesConsolidadas = await Reserva.countDocuments({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: inicioMes },
    });

    // Ingresos consolidados
    const reservasHoyConfirmadasConsolidadas = await Reserva.find({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: inicioHoy, $lt: finHoy },
      estado: { $in: ["confirmada", "completada"] },
    });

    const reservasSemanaConfirmadasConsolidadas = await Reserva.find({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: inicioSemana },
      estado: { $in: ["confirmada", "completada"] },
    });

    const reservasMesConfirmadasConsolidadas = await Reserva.find({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: inicioMes },
      estado: { $in: ["confirmada", "completada"] },
    });

    const ingresosHoyConsolidados = reservasHoyConfirmadasConsolidadas.reduce(
      (total, r) => total + r.precio_total,
      0
    );

    const ingresosSemanaConsolidados =
      reservasSemanaConfirmadasConsolidadas.reduce(
        (total, r) => total + r.precio_total,
        0
      );

    const ingresosMesConsolidados = reservasMesConfirmadasConsolidadas.reduce(
      (total, r) => total + r.precio_total,
      0
    );

    // Calcular ocupación promedio consolidada
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    const reservasUltimos30DiasConsolidadas = await Reserva.find({
      cancha_id: { $in: canchaIds },
      createdAt: { $gte: hace30Dias },
      estado: { $in: ["confirmada", "completada"] },
    });

    // Calcular horas totales disponibles de todas las canchas en 30 días
    let horasTotales30DiasConsolidadas = 0;
    let horasOcupadasConsolidadas = 0;

    for (const cancha of canchasDelPropietario) {
      const horasApertura = parseInt(cancha.horario_apertura.split(":")[0]);
      const horasCierre = parseInt(cancha.horario_cierre.split(":")[0]);
      const horasPorDia = horasCierre - horasApertura;
      horasTotales30DiasConsolidadas += horasPorDia * 30;
    }

    horasOcupadasConsolidadas = reservasUltimos30DiasConsolidadas.reduce(
      (total, r) => total + r.duracion_horas,
      0
    );

    const ocupacionPromedioConsolidada =
      horasTotales30DiasConsolidadas > 0
        ? (horasOcupadasConsolidadas / horasTotales30DiasConsolidadas) * 100
        : 0;

    // Preparar información de canchas
    const canchasInfo = await Promise.all(
      canchasDelPropietario.map(async (cancha) => {
        const reservasCancha = todasLasReservas.filter(
          (r) => r.cancha_id._id.toString() === cancha._id.toString()
        );

        const ingresosMesCancha = reservasCancha
          .filter(
            (r) =>
              r.createdAt >= inicioMes &&
              (r.estado === "confirmada" || r.estado === "completada")
          )
          .reduce((total, r) => total + r.precio_total, 0);

        return {
          _id: cancha._id.toString(),
          nombre: cancha.nombre,
          tipo_cancha: cancha.tipo_cancha,
          ubicacion: cancha.ubicacion,
          precio_por_hora: cancha.precio_por_hora,
          disponible: cancha.disponible,
          total_reservas: reservasCancha.length,
          ingresos_mes: ingresosMesCancha,
        };
      })
    );

    // Estadísticas de cancha específica (si se solicita)
    let estadisticasCancha = undefined;
    let canchaSeleccionada = undefined;

    if (canchaIdSeleccionada) {
      const cancha = canchasDelPropietario.find(
        (c) => c._id.toString() === canchaIdSeleccionada
      );

      if (cancha) {
        canchaSeleccionada = canchasInfo.find(
          (c) => c._id === canchaIdSeleccionada
        );

        // Calcular estadísticas específicas de esta cancha
        const reservasHoyCancha = await Reserva.countDocuments({
          cancha_id: cancha._id,
          createdAt: { $gte: inicioHoy, $lt: finHoy },
        });

        const reservasSemanaCancha = await Reserva.countDocuments({
          cancha_id: cancha._id,
          createdAt: { $gte: inicioSemana },
        });

        const reservasMesCancha = await Reserva.countDocuments({
          cancha_id: cancha._id,
          createdAt: { $gte: inicioMes },
        });

        const reservasHoyConfirmadasCancha = await Reserva.find({
          cancha_id: cancha._id,
          createdAt: { $gte: inicioHoy, $lt: finHoy },
          estado: { $in: ["confirmada", "completada"] },
        });

        const reservasSemanaConfirmadasCancha = await Reserva.find({
          cancha_id: cancha._id,
          createdAt: { $gte: inicioSemana },
          estado: { $in: ["confirmada", "completada"] },
        });

        const reservasMesConfirmadasCancha = await Reserva.find({
          cancha_id: cancha._id,
          createdAt: { $gte: inicioMes },
          estado: { $in: ["confirmada", "completada"] },
        });

        const ingresosHoyCancha = reservasHoyConfirmadasCancha.reduce(
          (total, r) => total + r.precio_total,
          0
        );

        const ingresosSemanaCancha = reservasSemanaConfirmadasCancha.reduce(
          (total, r) => total + r.precio_total,
          0
        );

        const ingresosMesCancha = reservasMesConfirmadasCancha.reduce(
          (total, r) => total + r.precio_total,
          0
        );

        // Ocupación de esta cancha específica
        const reservasUltimos30DiasCancha = await Reserva.find({
          cancha_id: cancha._id,
          createdAt: { $gte: hace30Dias },
          estado: { $in: ["confirmada", "completada"] },
        });

        const horasApertura = parseInt(cancha.horario_apertura.split(":")[0]);
        const horasCierre = parseInt(cancha.horario_cierre.split(":")[0]);
        const horasPorDia = horasCierre - horasApertura;
        const horasTotales30Dias = horasPorDia * 30;

        const horasOcupadas = reservasUltimos30DiasCancha.reduce(
          (total, r) => total + r.duracion_horas,
          0
        );

        const ocupacionPromedioCancha =
          horasTotales30Dias > 0
            ? (horasOcupadas / horasTotales30Dias) * 100
            : 0;

        estadisticasCancha = {
          reservas_hoy: reservasHoyCancha,
          reservas_semana: reservasSemanaCancha,
          reservas_mes: reservasMesCancha,
          ingresos_hoy: ingresosHoyCancha,
          ingresos_semana: ingresosSemanaCancha,
          ingresos_mes: ingresosMesCancha,
          ocupacion_promedio: Math.round(ocupacionPromedioCancha * 100) / 100,
        };
      }
    }

    // Obtener reservas recientes (últimas 10, de todas las canchas)
    const reservasRecientes = (await Reserva.find({
      cancha_id: { $in: canchaIds },
    })
      .populate("usuario_id", "nombre_completo email")
      .populate("cancha_id", "nombre")
      .sort({ createdAt: -1 })
      .limit(10)) as PopulatedReserva[];

    const dashboardData: PropietarioDashboard = {
      canchas: canchasInfo,
      cancha_seleccionada: canchaSeleccionada,
      estadisticas_consolidadas: {
        total_canchas: canchasDelPropietario.length,
        reservas_hoy: reservasHoyConsolidadas,
        reservas_semana: reservasSemanaConsolidadas,
        reservas_mes: reservasMesConsolidadas,
        ingresos_hoy: ingresosHoyConsolidados,
        ingresos_semana: ingresosSemanaConsolidados,
        ingresos_mes: ingresosMesConsolidados,
        ocupacion_promedio:
          Math.round(ocupacionPromedioConsolidada * 100) / 100,
      },
      estadisticas_cancha: estadisticasCancha,
      reservas_recientes: reservasRecientes.map((reserva) => ({
        _id: reserva._id.toString(),
        fecha: reserva.fecha,
        hora_inicio: reserva.hora_inicio,
        hora_fin: reserva.hora_fin,
        cancha_nombre: reserva.cancha_id.nombre,
        usuario: {
          nombre_completo: reserva.usuario_id.nombre_completo,
          email: reserva.usuario_id.email,
        },
        estado: reserva.estado,
        precio_total: reserva.precio_total,
      })),
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Dashboard del propietario obtenido exitosamente",
        data: dashboardData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener dashboard del propietario:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
