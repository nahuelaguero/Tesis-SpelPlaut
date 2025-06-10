import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import { isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface ValidacionReserva {
  cancha_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  usuario_id?: string;
}

interface ResultadoValidacion {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  precio_estimado?: number;
  conflictos?: Array<{
    hora_inicio: string;
    hora_fin: string;
    reserva_id: string;
    estado: string;
  }>;
  informacion_cancha?: {
    nombre: string;
    tipo: string;
    precio_por_hora: number;
    horario_apertura: string;
    horario_cierre: string;
  };
}

// Función utilitaria para convertir tiempo en formato HH:MM a minutos
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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

// POST /api/reservas/validar
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: ValidacionReserva = await request.json();
    const { cancha_id, fecha, hora_inicio, hora_fin, usuario_id } = body;

    const resultado: ResultadoValidacion = {
      valida: true,
      errores: [],
      advertencias: [],
    };

    // 1. VALIDACIONES BÁSICAS DE FORMATO

    // Validar campos requeridos manualmente para evitar problemas de tipo readonly
    const erroresCampos: string[] = [];

    if (!fecha || !fecha.trim()) {
      erroresCampos.push("La fecha es requerida");
    } else {
      const fechaDate = new Date(fecha);
      if (isNaN(fechaDate.getTime()) || fechaDate <= new Date()) {
        erroresCampos.push("La fecha debe ser futura");
      }
    }

    if (!hora_inicio || !hora_fin) {
      erroresCampos.push("Las horas son requeridas");
    } else {
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora_inicio)) {
        erroresCampos.push("Formato de hora de inicio inválido (HH:MM)");
      }
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora_fin)) {
        erroresCampos.push("Formato de hora de fin inválido (HH:MM)");
      }
    }

    if (erroresCampos.length > 0) {
      resultado.valida = false;
      resultado.errores.push(...erroresCampos);
    }

    // Validar ID de cancha
    if (!cancha_id || !isValidObjectId(cancha_id)) {
      resultado.valida = false;
      resultado.errores.push("ID de cancha inválido");
    }

    // Si hay errores básicos, retornar inmediatamente
    if (!resultado.valida) {
      return NextResponse.json<ApiResponse<ResultadoValidacion>>(
        {
          success: false,
          message: "Datos de reserva inválidos",
          data: resultado,
        },
        { status: 400 }
      );
    }

    // 2. VALIDAR EXISTENCIA DE LA CANCHA
    const cancha = await Cancha.findById(cancha_id);
    if (!cancha) {
      resultado.valida = false;
      resultado.errores.push("Cancha no encontrada");
      return NextResponse.json<ApiResponse<ResultadoValidacion>>(
        {
          success: false,
          message: "Cancha no encontrada",
          data: resultado,
        },
        { status: 404 }
      );
    }

    // Agregar información de la cancha
    resultado.informacion_cancha = {
      nombre: cancha.nombre,
      tipo: cancha.tipo_cancha,
      precio_por_hora: cancha.precio_por_hora,
      horario_apertura: cancha.horario_apertura,
      horario_cierre: cancha.horario_cierre,
    };

    // 3. VALIDAR DISPONIBILIDAD DE LA CANCHA
    if (!cancha.disponible) {
      resultado.valida = false;
      resultado.errores.push("La cancha no está disponible actualmente");
    }

    // 4. VALIDAR FECHA
    const fechaReserva = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaReserva < hoy) {
      resultado.valida = false;
      resultado.errores.push("No se pueden hacer reservas para fechas pasadas");
    }

    // Validar que no sea más de 30 días en el futuro
    const maxFecha = new Date();
    maxFecha.setDate(maxFecha.getDate() + 30);
    if (fechaReserva > maxFecha) {
      resultado.valida = false;
      resultado.errores.push(
        "No se pueden hacer reservas con más de 30 días de anticipación"
      );
    }

    // 5. VALIDAR DÍA OPERATIVO
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const diaSemana = diasSemana[fechaReserva.getDay()];

    if (!cancha.dias_operativos.includes(diaSemana)) {
      resultado.valida = false;
      resultado.errores.push(`La cancha no opera los ${diaSemana}s`);
    }

    // 6. VALIDAR HORARIOS DE OPERACIÓN
    const inicioMinutos = timeToMinutes(hora_inicio);
    const finMinutos = timeToMinutes(hora_fin);
    const aperturaMinutos = timeToMinutes(cancha.horario_apertura);
    const cierreMinutos = timeToMinutes(cancha.horario_cierre);

    if (inicioMinutos < aperturaMinutos) {
      resultado.valida = false;
      resultado.errores.push(`La cancha abre a las ${cancha.horario_apertura}`);
    }

    if (finMinutos > cierreMinutos) {
      resultado.valida = false;
      resultado.errores.push(`La cancha cierra a las ${cancha.horario_cierre}`);
    }

    if (inicioMinutos >= finMinutos) {
      resultado.valida = false;
      resultado.errores.push(
        "La hora de fin debe ser posterior a la hora de inicio"
      );
    }

    // 7. VALIDAR DURACIÓN MÍNIMA Y MÁXIMA
    const duracionMinutos = finMinutos - inicioMinutos;
    if (duracionMinutos < 60) {
      resultado.valida = false;
      resultado.errores.push("La reserva debe ser de al menos 1 hora");
    }

    if (duracionMinutos > 480) {
      // 8 horas
      resultado.valida = false;
      resultado.errores.push("La reserva no puede exceder las 8 horas");
    }

    // 8. VERIFICAR BLOQUEOS ESPECÍFICOS
    const bloqueosEspecificos = cancha.disponibilidad?.find(
      (disp: { fecha: string; disponible: boolean; motivo?: string }) =>
        disp.fecha === fecha && !disp.disponible
    );

    if (bloqueosEspecificos) {
      resultado.valida = false;
      resultado.errores.push(
        bloqueosEspecificos.motivo || "Fecha no disponible"
      );
    }

    // 9. VERIFICAR CONFLICTOS CON RESERVAS EXISTENTES
    const reservasExistentes = await Reserva.find({
      cancha_id,
      fecha,
      estado: { $in: ["pendiente", "confirmada"] },
    });

    const conflictos: Array<{
      hora_inicio: string;
      hora_fin: string;
      reserva_id: string;
      estado: string;
    }> = [];

    for (const reserva of reservasExistentes) {
      if (
        hasTimeConflict(
          hora_inicio,
          hora_fin,
          reserva.hora_inicio,
          reserva.hora_fin
        )
      ) {
        // Si es la misma reserva del usuario (edición), permitir
        if (usuario_id && reserva.usuario_id.toString() === usuario_id) {
          resultado.advertencias.push("Estás editando una reserva existente");
          continue;
        }

        conflictos.push({
          hora_inicio: reserva.hora_inicio,
          hora_fin: reserva.hora_fin,
          reserva_id: reserva._id.toString(),
          estado: reserva.estado,
        });
      }
    }

    if (conflictos.length > 0) {
      resultado.valida = false;
      resultado.errores.push(
        "El horario solicitado tiene conflictos con reservas existentes"
      );
      resultado.conflictos = conflictos;
    }

    // 10. CALCULAR PRECIO ESTIMADO
    if (resultado.valida || resultado.errores.length === 0) {
      const duracionHoras = duracionMinutos / 60;
      resultado.precio_estimado = Math.round(
        duracionHoras * cancha.precio_por_hora
      );
    }

    // 11. AGREGAR ADVERTENCIAS ADICIONALES

    // Reserva muy próxima
    const ahora = new Date();
    const tiempoParaReserva = fechaReserva.getTime() - ahora.getTime();
    const horasParaReserva = tiempoParaReserva / (1000 * 60 * 60);

    if (horasParaReserva < 2) {
      resultado.advertencias.push(
        "Reserva con menos de 2 horas de anticipación"
      );
    }

    // Horario muy temprano o muy tarde
    if (inicioMinutos < 480) {
      // antes de las 8:00
      resultado.advertencias.push("Horario muy temprano");
    }

    if (inicioMinutos > 1320) {
      // después de las 22:00
      resultado.advertencias.push("Horario muy tarde");
    }

    // Reserva muy larga
    if (duracionMinutos > 180) {
      // más de 3 horas
      resultado.advertencias.push("Reserva de larga duración");
    }

    return NextResponse.json<ApiResponse<ResultadoValidacion>>(
      {
        success: resultado.valida,
        message: resultado.valida
          ? "Reserva válida"
          : `Reserva inválida: ${resultado.errores.join(", ")}`,
        data: resultado,
      },
      { status: resultado.valida ? 200 : 400 }
    );
  } catch (error) {
    console.error("Error al validar reserva:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
