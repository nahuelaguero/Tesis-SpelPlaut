import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import { isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

// Función utilitaria para convertir tiempo en formato HH:MM a minutos
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Función para generar slots de tiempo
function generateTimeSlots(
  horarioApertura: string,
  horarioCierre: string,
  slotDuration: number = 60 // duración en minutos
): string[] {
  const slots: string[] = [];
  const start = timeToMinutes(horarioApertura);
  const end = timeToMinutes(horarioCierre);

  for (let time = start; time < end; time += slotDuration) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    slots.push(timeString);
  }

  return slots;
}

// Función para verificar si hay conflicto entre horarios
function hasTimeConflict(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
}

// GET /api/reservas/disponibilidad?cancha_id=xxx&fecha=2024-01-01&duracion=60
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const cancha_id = searchParams.get("cancha_id");
    const fecha = searchParams.get("fecha");
    const duracion = parseInt(searchParams.get("duracion") || "60");

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

    if (!fecha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La fecha es requerida (formato: YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    // Validar formato de fecha
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Formato de fecha inválido. Use YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // Verificar que la fecha no sea pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaDate < hoy) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se pueden hacer reservas para fechas pasadas",
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

    if (!cancha.disponible) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La cancha no está disponible",
          data: {
            disponibilidad: {
              fecha,
              cancha_id,
              horarios_disponibles: [],
              horarios_ocupados: [],
              motivo: "Cancha temporalmente cerrada",
            },
          },
        },
        { status: 200 }
      );
    }

    // Verificar día operativo
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const diaSemana = diasSemana[fechaDate.getDay()];

    if (!cancha.dias_operativos.includes(diaSemana)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `La cancha no opera los ${diaSemana}s`,
          data: {
            disponibilidad: {
              fecha,
              cancha_id,
              horarios_disponibles: [],
              horarios_ocupados: [],
              motivo: `No opera los ${diaSemana}s`,
            },
          },
        },
        { status: 200 }
      );
    }

    // Obtener reservas existentes para la fecha
    const reservasExistentes = await Reserva.find({
      cancha_id,
      fecha,
      estado: { $in: ["pendiente", "confirmada"] },
    }).select("hora_inicio hora_fin estado");

    // Generar todos los slots disponibles basados en horario de operación
    const slotsDisponibles = generateTimeSlots(
      cancha.horario_apertura,
      cancha.horario_cierre,
      duracion
    );

    // Filtrar slots que no entran en conflicto con reservas existentes
    const horariosDisponibles: string[] = [];
    const horariosOcupados: Array<{
      hora_inicio: string;
      hora_fin: string;
      estado: string;
    }> = [];

    // Procesar reservas existentes
    reservasExistentes.forEach((reserva) => {
      horariosOcupados.push({
        hora_inicio: reserva.hora_inicio,
        hora_fin: reserva.hora_fin,
        estado: reserva.estado,
      });
    });

    // Verificar disponibilidad para cada slot
    slotsDisponibles.forEach((slot) => {
      const slotMinutes = timeToMinutes(slot);
      const slotEndMinutes = slotMinutes + duracion;

      // Convertir de vuelta a formato HH:MM
      const slotEndHours = Math.floor(slotEndMinutes / 60);
      const slotEndMins = slotEndMinutes % 60;
      const slotEnd = `${slotEndHours.toString().padStart(2, "0")}:${slotEndMins
        .toString()
        .padStart(2, "0")}`;

      // Verificar que el slot no exceda el horario de cierre
      if (slotEndMinutes > timeToMinutes(cancha.horario_cierre)) {
        return; // Skip este slot
      }

      // Verificar conflictos con reservas existentes
      let tieneConflicto = false;
      for (const reserva of reservasExistentes) {
        if (
          hasTimeConflict(slot, slotEnd, reserva.hora_inicio, reserva.hora_fin)
        ) {
          tieneConflicto = true;
          break;
        }
      }

      if (!tieneConflicto) {
        horariosDisponibles.push(slot);
      }
    });

    // Verificar bloqueos específicos de disponibilidad (si existen)
    const bloqueosEspecificos = cancha.disponibilidad?.find(
      (disp: { fecha: string; disponible: boolean; motivo?: string }) =>
        disp.fecha === fecha && !disp.disponible
    );

    if (bloqueosEspecificos) {
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Disponibilidad obtenida exitosamente",
          data: {
            disponibilidad: {
              fecha,
              cancha_id,
              horarios_disponibles: [],
              horarios_ocupados: horariosOcupados,
              motivo: bloqueosEspecificos.motivo || "Fecha bloqueada",
            },
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Disponibilidad obtenida exitosamente",
        data: {
          disponibilidad: {
            fecha,
            cancha_id,
            duracion_reserva: duracion,
            horario_operacion: {
              apertura: cancha.horario_apertura,
              cierre: cancha.horario_cierre,
            },
            horarios_disponibles: horariosDisponibles,
            horarios_ocupados: horariosOcupados,
            precio_por_hora: cancha.precio_por_hora,
            dias_operativos: cancha.dias_operativos,
            dia_actual: diaSemana,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// POST /api/reservas/disponibilidad - Bloquear/Desbloquear horarios específicos
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { cancha_id, fecha, horarios_bloqueados, motivo, accion } = body;

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

    if (!fecha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La fecha es requerida",
        },
        { status: 400 }
      );
    }

    if (!accion || !["bloquear", "desbloquear"].includes(accion)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acción inválida. Use 'bloquear' o 'desbloquear'",
        },
        { status: 400 }
      );
    }

    // Verificar que la cancha existe
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

    if (accion === "bloquear") {
      if (!horarios_bloqueados || !Array.isArray(horarios_bloqueados)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Los horarios a bloquear son requeridos",
          },
          { status: 400 }
        );
      }

      // Agregar bloqueo a la disponibilidad de la cancha
      const disponibilidadExistente = cancha.disponibilidad?.find(
        (disp: { fecha: string; disponible: boolean; motivo?: string }) =>
          disp.fecha === fecha
      );

      if (disponibilidadExistente) {
        disponibilidadExistente.disponible = false;
        disponibilidadExistente.motivo = motivo || "Horarios bloqueados";
      } else {
        if (!cancha.disponibilidad) {
          cancha.disponibilidad = [];
        }
        cancha.disponibilidad.push({
          fecha,
          disponible: false,
          motivo: motivo || "Horarios bloqueados",
        });
      }
    } else {
      // Desbloquear - remover de disponibilidad
      if (cancha.disponibilidad) {
        cancha.disponibilidad = cancha.disponibilidad.filter(
          (disp: { fecha: string; disponible: boolean; motivo?: string }) =>
            disp.fecha !== fecha
        );
      }
    }

    await cancha.save();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: `Disponibilidad ${
          accion === "bloquear" ? "bloqueada" : "desbloqueada"
        } exitosamente`,
        data: {
          cancha_id,
          fecha,
          accion,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al gestionar disponibilidad:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
