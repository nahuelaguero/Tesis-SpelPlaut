import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import Usuario from "@/models/Usuario";
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { sendReservationConfirmation } from "@/lib/email";

// Función utilitaria para convertir tiempo en formato HH:MM a minutos
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación (el 2FA ya se validó en el login)
    const userPayload = requireAuth(request);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    // Obtener el usuario completo de la base de datos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await Usuario.findById(userPayload.userId).lean() as any;
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cancha_id = searchParams.get("cancha_id");
    const fecha = searchParams.get("fecha");
    const estado = searchParams.get("estado");

    // Construir filtros
    const filters: Record<string, unknown> = {};

    // Si es admin, puede ver todas las reservas, si no solo las suyas
    if (user.rol !== "admin") {
      filters.usuario_id = user._id;
    }

    if (cancha_id) {
      if (!isValidObjectId(cancha_id)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "ID de cancha inválido",
          },
          { status: 400 }
        );
      }
      filters.cancha_id = cancha_id;
    }

    if (fecha) {
      // Validar formato de fecha YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Formato de fecha inválido. Use YYYY-MM-DD",
          },
          { status: 400 }
        );
      }
      filters.fecha = fecha;
    }

    if (estado) {
      filters.estado = estado;
    }

    const reservas = await Reserva.find(filters)
      .populate("cancha_id", "nombre tipo ubicacion precio_hora")
      .populate("usuario_id", "nombre_completo email telefono")
      .sort({ fecha: -1, hora_inicio: 1 })
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas obtenidas exitosamente",
      data: { reservas },
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    // Verificar autenticación (el 2FA ya se validó en el login)
    const userPayload = requireAuth(request);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Debes iniciar sesión.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      cancha_id,
      fecha_reserva,
      hora_inicio,
      hora_fin,
      precio_total,
      metodo_pago,
      notas,
      numero_jugadores,
    } = body;

    // Validaciones básicas
    if (
      !cancha_id ||
      !fecha_reserva ||
      !hora_inicio ||
      !hora_fin ||
      !precio_total
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Todos los campos obligatorios deben ser completados",
        },
        { status: 400 }
      );
    }

    // Obtener usuario y cancha en paralelo (queries independientes)
    const [user, cancha] = (await Promise.all([
      Usuario.findById(userPayload.userId).lean(),
      Cancha.findById(cancha_id).lean(),
    ])) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [any, any];

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado.",
        },
        { status: 401 }
      );
    }

    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar estado de la cancha (usar disponible si estado no está definido)
    if (cancha.estado && cancha.estado !== "activo") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La cancha no está disponible",
        },
        { status: 400 }
      );
    }

    // Verificar disponibilidad general de la cancha
    if (cancha.disponible === false) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La cancha no está disponible",
        },
        { status: 400 }
      );
    }

    // Verificar disponibilidad específica de la fecha
    if (cancha.disponibilidad && cancha.disponibilidad.length > 0) {
      const disponibilidadFecha = cancha.disponibilidad.find(
        (d: { fecha: string; disponible: boolean; motivo?: string }) =>
          d.fecha === fecha_reserva
      );

      if (disponibilidadFecha && !disponibilidadFecha.disponible) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: `La cancha no está disponible para esta fecha${
              disponibilidadFecha.motivo
                ? `: ${disponibilidadFecha.motivo}`
                : ""
            }`,
          },
          { status: 400 }
        );
      }
    }

    // Validar formato de horas
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fin)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Formato de hora inválido (HH:MM)",
        },
        { status: 400 }
      );
    }

    // Validar que la fecha sea futura
    const fechaReservaString = fecha_reserva; // "YYYY-MM-DD"
    const todayString = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    if (fechaReservaString < todayString) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se pueden hacer reservas para fechas pasadas",
        },
        { status: 400 }
      );
    }

    // Crear la fecha para la base de datos (asegurándose de la zona horaria local)
    const fechaReservaDate = new Date(fecha_reserva + "T00:00:00.000");

    // Validar que la cancha opera ese día de la semana (solo si está definido)
    if (cancha.dias_operativos && cancha.dias_operativos.length > 0) {
      const diasSemana = [
        "domingo",
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
      ];
      const dayOfWeek = diasSemana[fechaReservaDate.getDay()];

      if (!cancha.dias_operativos.includes(dayOfWeek)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: `La cancha no opera los ${dayOfWeek}s`,
          },
          { status: 400 }
        );
      }
    }

    // Validar capacidad de jugadores si se especifica
    if (numero_jugadores && numero_jugadores > cancha.capacidad_jugadores) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Capacidad máxima: ${cancha.capacidad_jugadores} jugadores`,
        },
        { status: 400 }
      );
    }

    // Validar horarios de la cancha - usar horarios_disponibles o valores por defecto
    const [inicioHour, inicioMin] = hora_inicio.split(":").map(Number);
    const [finHour, finMin] = hora_fin.split(":").map(Number);

    // Convertir a minutos para comparación más precisa
    const inicioMinutos = inicioHour * 60 + inicioMin;
    const finMinutos = finHour * 60 + finMin;

    // Validar que la hora de fin sea después de la hora de inicio
    if (finMinutos <= inicioMinutos) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La hora de fin debe ser posterior a la hora de inicio",
        },
        { status: 400 }
      );
    }

    // Validar duración mínima (ej: 30 minutos)
    if (finMinutos - inicioMinutos < 30) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La reserva debe ser de al menos 30 minutos",
        },
        { status: 400 }
      );
    }

    // Validar horarios contra los horarios específicos de la cancha
    const aperturaMinutos = timeToMinutes(cancha.horario_apertura);
    const cierreMinutos = timeToMinutes(cancha.horario_cierre);

    if (inicioMinutos < aperturaMinutos || finMinutos > cierreMinutos) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Los horarios deben estar entre ${cancha.horario_apertura} y ${cancha.horario_cierre}`,
        },
        { status: 400 }
      );
    }

    // Verificar que no hay reservas superpuestas (excluir canceladas)
    const reservasSuperpuestas = await Reserva.find({
      cancha_id,
      fecha: fecha_reserva, // Usar fecha string en lugar de Date
      estado: { $ne: "cancelada" },
      $or: [
        {
          $and: [
            { hora_inicio: { $lte: hora_inicio } },
            { hora_fin: { $gt: hora_inicio } },
          ],
        },
        {
          $and: [
            { hora_inicio: { $lt: hora_fin } },
            { hora_fin: { $gte: hora_fin } },
          ],
        },
        {
          $and: [
            { hora_inicio: { $gte: hora_inicio } },
            { hora_fin: { $lte: hora_fin } },
          ],
        },
      ],
    }).select('hora_inicio hora_fin').lean();

    if (reservasSuperpuestas.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Ya existe una reserva en el horario seleccionado",
        },
        { status: 409 }
      );
    }

    // Calcular duración en horas
    const duracion_horas = (finMinutos - inicioMinutos) / 60;

    // Solo bloquear a propietarios de cancha (admins pueden hacer reservas)
    if (user.rol === "propietario_cancha") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Los propietarios de cancha no pueden hacer reservas. Solo pueden gestionar su cancha.",
        },
        { status: 403 }
      );
    }

    console.log(`🔒 Creando reserva para usuario: ${user._id} (${user.email})`);

    // Validar método de pago
    const metodosValidos = [
      "efectivo",
      "bancard_card",
      "bancard_apple_pay",
      "bancard_google_pay",
      "bancard_qr",
    ];
    if (metodo_pago && !metodosValidos.includes(metodo_pago)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Método de pago no válido",
        },
        { status: 400 }
      );
    }

    // Crear la reserva
    const nuevaReserva = new Reserva({
      cancha_id,
      usuario_id: user._id,
      fecha: fecha_reserva, // String YYYY-MM-DD (requerido por el modelo)
      fecha_reserva: fechaReservaDate, // Date object para queries
      hora_inicio,
      hora_fin,
      duracion_horas,
      precio_total: Number(precio_total),
      metodo_pago: metodo_pago || "efectivo",
      notas: notas || undefined,
      estado: "pendiente",
      pagado: false,
    });

    await nuevaReserva.save();

    // Populate para devolver datos completos
    await nuevaReserva.populate([
      { path: "cancha_id", select: "nombre tipo ubicacion" },
      { path: "usuario_id", select: "nombre_completo email" },
    ]);

    // Enviar email de confirmación (fire-and-forget, no bloquea la respuesta)
    if (user.email) {
      void sendReservationConfirmation(
        user.email,
        user.nombre_completo || "Usuario",
        {
          canchaName: (nuevaReserva.cancha_id as { nombre: string }).nombre,
          fecha: fechaReservaDate.toISOString(),
          horaInicio: hora_inicio,
          horaFin: hora_fin,
          precio: Number(precio_total),
          metodoPago: metodo_pago || "efectivo",
          reservaId: nuevaReserva._id.toString(),
        }
      ).then((sent) => {
        if (sent) {
          console.log(`📧 Email de confirmación enviado a ${user.email}`);
        } else {
          console.log(`❌ Error enviando email a ${user.email}`);
        }
      }).catch((emailError) => {
        console.error("❌ Error enviando email de confirmación:", emailError);
      });
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Reserva creada exitosamente",
        data: { reserva: nuevaReserva },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear reserva:", error);

    if (error instanceof Error) {
      // Errores de validación de Mongoose
      if (error.name === "ValidationError") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Datos de entrada inválidos",
          },
          { status: 400 }
        );
      }

      // Error de clave duplicada (reserva superpuesta)
      if (error.message.includes("duplicate key")) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Ya existe una reserva en el horario seleccionado",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
        data: null,
      },
      { status: 500 }
    );
  }
}
