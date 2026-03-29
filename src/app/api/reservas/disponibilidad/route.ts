import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import { isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";
import {
  calculateReservationPrice,
  getDayName,
  minutesToTime,
  sanitizeInterval,
  timeToMinutes,
} from "@/lib/pricing";

function hasTimeConflict(
  start1: string,
  end1: string,
  start2: string,
  end2: string
) {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
}

function isSameDate(dateString: string, date: Date) {
  const todayString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

  return dateString === todayString;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const cancha_id = searchParams.get("cancha_id");
    const fecha = searchParams.get("fecha");

    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de cancha inválido" },
        { status: 400 }
      );
    }

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La fecha es requerida con formato YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    const cancha = await Cancha.findById(cancha_id).lean();
    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Cancha no encontrada" },
        { status: 404 }
      );
    }

    const intervalMinutes = sanitizeInterval(cancha.intervalo_reserva_minutos);
    const requestedDuration = Number(
      searchParams.get("duracion") || intervalMinutes
    );

    if (requestedDuration < intervalMinutes || requestedDuration % intervalMinutes !== 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `La duración debe ser múltiplo de ${intervalMinutes} minutos.`,
        },
        { status: 400 }
      );
    }

    const selectedDate = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Fecha inválida." },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (selectedDate < today) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se pueden consultar horarios para fechas pasadas.",
        },
        { status: 400 }
      );
    }

    if (!cancha.disponible) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "La cancha está cerrada.",
        data: {
          disponibilidad: {
            fecha,
            cancha_id,
            horarios_disponibles: [],
            horarios_disponibles_detalle: [],
            horarios_ocupados: [],
            motivo: "Cancha temporalmente cerrada",
          },
        },
      });
    }

    const dayName = getDayName(fecha);
    if (!cancha.dias_operativos.includes(dayName)) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: `La cancha no opera los ${dayName}s.`,
        data: {
          disponibilidad: {
            fecha,
            cancha_id,
            horarios_disponibles: [],
            horarios_disponibles_detalle: [],
            horarios_ocupados: [],
            motivo: `No opera los ${dayName}s`,
          },
        },
      });
    }

    const blockedDate = cancha.disponibilidad?.find(
      (item) => item.fecha === fecha && !item.disponible
    );
    if (blockedDate) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Fecha bloqueada por el propietario.",
        data: {
          disponibilidad: {
            fecha,
            cancha_id,
            horarios_disponibles: [],
            horarios_disponibles_detalle: [],
            horarios_ocupados: [],
            motivo: blockedDate.motivo || "Fecha bloqueada",
          },
        },
      });
    }

    const reservasExistentes = await Reserva.find({
      cancha_id,
      fecha,
      estado: { $in: ["pendiente", "pendiente_aprobacion", "confirmada"] },
    })
      .select("hora_inicio hora_fin estado")
      .lean();

    const horariosOcupados = reservasExistentes.map((reserva) => ({
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      estado: reserva.estado,
    }));

    const openingMinutes = timeToMinutes(cancha.horario_apertura);
    const closingMinutes = timeToMinutes(cancha.horario_cierre);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const horariosDisponibles: string[] = [];
    const horariosDisponiblesDetalle: Array<{
      hora_inicio: string;
      hora_fin: string;
      precio_total: number;
      duracion_minutos: number;
      desglose_precio: Array<{
        hora_inicio: string;
        hora_fin: string;
        precio_por_hora: number;
        subtotal: number;
      }>;
    }> = [];

    for (
      let slotStart = openingMinutes;
      slotStart + requestedDuration <= closingMinutes;
      slotStart += intervalMinutes
    ) {
      if (isSameDate(fecha, now) && slotStart <= nowMinutes) {
        continue;
      }

      const startTime = minutesToTime(slotStart);
      const endTime = minutesToTime(slotStart + requestedDuration);

      const hasConflict = reservasExistentes.some((reserva) =>
        hasTimeConflict(startTime, endTime, reserva.hora_inicio, reserva.hora_fin)
      );

      if (hasConflict) {
        continue;
      }

      const priceInfo = calculateReservationPrice({
        cancha,
        fecha,
        horaInicio: startTime,
        horaFin: endTime,
      });

      horariosDisponibles.push(startTime);
      horariosDisponiblesDetalle.push({
        hora_inicio: startTime,
        hora_fin: endTime,
        precio_total: priceInfo.total,
        duracion_minutos: priceInfo.durationMinutes,
        desglose_precio: priceInfo.breakdown,
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Disponibilidad obtenida exitosamente",
      data: {
        disponibilidad: {
          fecha,
          cancha_id,
          dia_actual: dayName,
          duracion_reserva: requestedDuration,
          intervalo_reserva_minutos: intervalMinutes,
          horario_operacion: {
            apertura: cancha.horario_apertura,
            cierre: cancha.horario_cierre,
          },
          horarios_disponibles: horariosDisponibles,
          horarios_disponibles_detalle: horariosDisponiblesDetalle,
          horarios_ocupados: horariosOcupados,
          precio_por_hora: cancha.precio_por_hora,
          precios_por_horario: cancha.precios_por_horario || [],
          dias_operativos: cancha.dias_operativos,
          aprobacion_automatica: cancha.aprobacion_automatica !== false,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { cancha_id, fecha, motivo, accion } = body;

    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de cancha inválido" },
        { status: 400 }
      );
    }

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La fecha es requerida." },
        { status: 400 }
      );
    }

    if (!accion || !["bloquear", "desbloquear"].includes(accion)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La acción debe ser bloquear o desbloquear." },
        { status: 400 }
      );
    }

    const cancha = await Cancha.findById(cancha_id);
    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Cancha no encontrada" },
        { status: 404 }
      );
    }

    if (accion === "bloquear") {
      const existing = cancha.disponibilidad?.find((item) => item.fecha === fecha);
      if (existing) {
        existing.disponible = false;
        existing.motivo = motivo || "Fecha bloqueada";
      } else {
        cancha.disponibilidad = cancha.disponibilidad || [];
        cancha.disponibilidad.push({
          fecha,
          disponible: false,
          motivo: motivo || "Fecha bloqueada",
        });
      }
    } else {
      cancha.disponibilidad =
        cancha.disponibilidad?.filter((item) => item.fecha !== fecha) || [];
    }

    await cancha.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Disponibilidad ${accion === "bloquear" ? "bloqueada" : "desbloqueada"} exitosamente.`,
      data: {
        fecha,
        accion,
      },
    });
  } catch (error) {
    console.error("Error al gestionar disponibilidad:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
