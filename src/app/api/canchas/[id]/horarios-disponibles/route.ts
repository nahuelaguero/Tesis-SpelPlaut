import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import Reserva from "@/models/Reserva";
import { ApiResponse } from "@/types";

// Función utilitaria para convertir tiempo en formato HH:MM a minutos
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Función utilitaria para convertir minutos a formato HH:MM
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    // Validaciones
    if (!fecha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El parámetro 'fecha' es requerido (formato: YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Formato de fecha inválido. Use YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // Validar que no sea fecha pasada
    const fechaReserva = new Date(fecha + "T00:00:00.000");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaReserva < hoy) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se pueden consultar fechas pasadas",
        },
        { status: 400 }
      );
    }

    // Buscar cancha
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cancha = await Cancha.findById(id).lean() as any;
    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // Validar día operativo
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const dayOfWeek = diasSemana[fechaReserva.getDay()];

    if (cancha.dias_operativos && !cancha.dias_operativos.includes(dayOfWeek)) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: `La cancha no opera los ${dayOfWeek}s`,
        data: {
          fecha,
          cancha: cancha.nombre,
          disponible: false,
          motivo: `No opera los ${dayOfWeek}s`,
          horarios_disponibles: [],
        },
      });
    }

    // Verificar disponibilidad específica de la fecha
    if (cancha.disponibilidad && cancha.disponibilidad.length > 0) {
      const disponibilidadFecha = cancha.disponibilidad.find(
        (d: { fecha: string; disponible: boolean; motivo?: string }) =>
          d.fecha === fecha
      );

      if (disponibilidadFecha && !disponibilidadFecha.disponible) {
        return NextResponse.json<ApiResponse>({
          success: true,
          message: "Cancha no disponible para esta fecha",
          data: {
            fecha,
            cancha: cancha.nombre,
            disponible: false,
            motivo: disponibilidadFecha.motivo || "No disponible",
            horarios_disponibles: [],
          },
        });
      }
    }

    // Obtener reservas existentes para esa fecha (usar campo 'fecha' string para aprovechar índice)
    const reservasExistentes = await Reserva.find({
      cancha_id: id,
      fecha: fecha,
      estado: { $ne: "cancelada" },
    }).select("hora_inicio hora_fin").lean();

    // Generar horarios disponibles
    const aperturaMinutos = timeToMinutes(cancha.horario_apertura);
    const cierreMinutos = timeToMinutes(cancha.horario_cierre);
    const intervalo = 30; // Intervalos de 30 minutos

    const horariosDisponibles: string[] = [];

    for (
      let minutos = aperturaMinutos;
      minutos < cierreMinutos;
      minutos += intervalo
    ) {
      const horaInicio = minutesToTime(minutos);
      const horaFin = minutesToTime(minutos + intervalo);

      // Verificar si este horario está ocupado
      const ocupado = reservasExistentes.some((reserva) => {
        const reservaInicio = timeToMinutes(reserva.hora_inicio);
        const reservaFin = timeToMinutes(reserva.hora_fin);

        // Verificar superposición
        return (
          (minutos >= reservaInicio && minutos < reservaFin) ||
          (minutos + intervalo > reservaInicio &&
            minutos + intervalo <= reservaFin) ||
          (minutos <= reservaInicio && minutos + intervalo >= reservaFin)
        );
      });

      if (!ocupado) {
        horariosDisponibles.push(`${horaInicio} - ${horaFin}`);
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Horarios disponibles obtenidos exitosamente",
      data: {
        fecha,
        cancha: cancha.nombre,
        disponible: true,
        horario_apertura: cancha.horario_apertura,
        horario_cierre: cancha.horario_cierre,
        precio_por_hora: cancha.precio_por_hora,
        capacidad_jugadores: cancha.capacidad_jugadores,
        horarios_disponibles: horariosDisponibles,
        reservas_existentes: reservasExistentes.length,
      },
    });
  } catch (error) {
    console.error("Error obteniendo horarios disponibles:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
