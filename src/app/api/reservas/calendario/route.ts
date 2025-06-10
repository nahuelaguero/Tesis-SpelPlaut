import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import { isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface CalendarioDay {
  fecha: string;
  diaSemana: string;
  disponible: boolean;
  reservas: Array<{
    _id: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    usuario?: {
      nombre_completo: string;
      email: string;
    };
  }>;
  motivo_no_disponible?: string;
  es_dia_operativo: boolean;
}

interface CalendarioMes {
  año: number;
  mes: number;
  nombre_mes: string;
  dias: CalendarioDay[];
  estadisticas: {
    total_dias: number;
    dias_disponibles: number;
    dias_con_reservas: number;
    total_reservas: number;
    ingresos_proyectados: number;
  };
}

// GET /api/reservas/calendario?cancha_id=xxx&año=2024&mes=1
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const cancha_id = searchParams.get("cancha_id");
    const año = parseInt(
      searchParams.get("año") || new Date().getFullYear().toString()
    );
    const mes = parseInt(
      searchParams.get("mes") || (new Date().getMonth() + 1).toString()
    );

    // Validaciones
    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de cancha inválido",
        },
        { status: 400 }
      );
    }

    if (año < 2020 || año > 2030) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Año inválido (debe estar entre 2020 y 2030)",
        },
        { status: 400 }
      );
    }

    if (mes < 1 || mes > 12) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Mes inválido (debe estar entre 1 y 12)",
        },
        { status: 400 }
      );
    }

    // Obtener información de la cancha
    const cancha = await Cancha.findById(cancha_id);
    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // Calcular rango de fechas del mes
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0); // Último día del mes

    // Obtener todas las reservas del mes
    const reservasDelMes = await Reserva.find({
      cancha_id,
      fecha: {
        $gte: fechaInicio.toISOString().split("T")[0],
        $lte: fechaFin.toISOString().split("T")[0],
      },
    })
      .populate("usuario_id", "nombre_completo email")
      .sort({ fecha: 1, hora_inicio: 1 });

    // Generar calendario
    const diasDelCalendario: CalendarioDay[] = [];
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
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

    const estadisticas = {
      total_dias: 0,
      dias_disponibles: 0,
      dias_con_reservas: 0,
      total_reservas: 0,
      ingresos_proyectados: 0,
    };

    // Iterar por cada día del mes
    for (let dia = 1; dia <= fechaFin.getDate(); dia++) {
      const fechaActual = new Date(año, mes - 1, dia);
      const fechaString = fechaActual.toISOString().split("T")[0];
      const diaSemanaIndex = fechaActual.getDay();
      const diaSemanaString = diasSemana[diaSemanaIndex];

      // Verificar si es día operativo
      const esDiaOperativo = cancha.dias_operativos.includes(diaSemanaString);

      // Obtener reservas para este día
      const reservasDelDia = reservasDelMes.filter(
        (reserva) => reserva.fecha === fechaString
      );

      // Verificar disponibilidad específica
      const disponibilidadEspecifica = cancha.disponibilidad?.find(
        (disp: { fecha: string; disponible: boolean; motivo?: string }) =>
          disp.fecha === fechaString
      );

      let disponible = true;
      let motivoNoDisponible: string | undefined;

      // Determinar disponibilidad
      if (!cancha.disponible) {
        disponible = false;
        motivoNoDisponible = "Cancha temporalmente cerrada";
      } else if (!esDiaOperativo) {
        disponible = false;
        motivoNoDisponible = `No opera los ${diaSemanaString}s`;
      } else if (
        disponibilidadEspecifica &&
        !disponibilidadEspecifica.disponible
      ) {
        disponible = false;
        motivoNoDisponible = disponibilidadEspecifica.motivo || "Día bloqueado";
      }

      // Calcular ingresos del día
      const ingresosDia = reservasDelDia
        .filter((r) => r.estado === "confirmada" || r.estado === "completada")
        .reduce((total, r) => total + r.precio_total, 0);

      const diaCalendario: CalendarioDay = {
        fecha: fechaString,
        diaSemana: diaSemanaString,
        disponible,
        es_dia_operativo: esDiaOperativo,
        motivo_no_disponible: motivoNoDisponible,
        reservas: reservasDelDia.map((reserva) => ({
          _id: reserva._id.toString(),
          hora_inicio: reserva.hora_inicio,
          hora_fin: reserva.hora_fin,
          estado: reserva.estado,
          usuario: reserva.usuario_id
            ? {
                nombre_completo: (
                  reserva.usuario_id as {
                    nombre_completo: string;
                    email: string;
                  }
                ).nombre_completo,
                email: (
                  reserva.usuario_id as {
                    nombre_completo: string;
                    email: string;
                  }
                ).email,
              }
            : undefined,
        })),
      };

      diasDelCalendario.push(diaCalendario);

      // Actualizar estadísticas
      estadisticas.total_dias++;
      if (disponible) estadisticas.dias_disponibles++;
      if (reservasDelDia.length > 0) estadisticas.dias_con_reservas++;
      estadisticas.total_reservas += reservasDelDia.length;
      estadisticas.ingresos_proyectados += ingresosDia;
    }

    const calendario: CalendarioMes = {
      año,
      mes,
      nombre_mes: nombresMeses[mes - 1],
      dias: diasDelCalendario,
      estadisticas,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Calendario obtenido exitosamente",
        data: {
          calendario,
          cancha: {
            _id: cancha._id,
            nombre: cancha.nombre,
            tipo_cancha: cancha.tipo_cancha,
            precio_por_hora: cancha.precio_por_hora,
            horario_apertura: cancha.horario_apertura,
            horario_cierre: cancha.horario_cierre,
            dias_operativos: cancha.dias_operativos,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener calendario:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
