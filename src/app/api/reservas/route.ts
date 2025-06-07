import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import Usuario from "@/models/Usuario";
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { sendReservationConfirmation } from "@/lib/email";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación
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

    const { searchParams } = new URL(request.url);
    const cancha_id = searchParams.get("cancha_id");
    const fecha = searchParams.get("fecha");
    const estado = searchParams.get("estado");

    // Construir filtros
    const filters: Record<string, unknown> = {};

    // Si es admin, puede ver todas las reservas, si no solo las suyas
    if (user.rol !== "admin") {
      filters.usuario_id = user.userId;
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
      .sort({ fecha: -1, hora_inicio: 1 });

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
    // Verificar autenticación
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autorizado - Sin token",
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as { userId: string; email: string; rol: string };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido o expirado",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      cancha_id,
      fecha_reserva,
      hora_inicio,
      hora_fin,
      precio_total,
      metodo_pago,
      notas,
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

    // Verificar que la cancha existe y está disponible
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

    if (cancha.estado !== "activo") {
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

    // Si la cancha tiene horarios específicos, validar contra ellos
    // Por ahora usamos un rango general de 6:00 a 23:00
    const aperturaMinutos = 6 * 60; // 6:00 AM
    const cierreMinutos = 23 * 60; // 11:00 PM

    if (inicioMinutos < aperturaMinutos || finMinutos > cierreMinutos) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Los horarios deben estar entre 06:00 y 23:00",
        },
        { status: 400 }
      );
    }

    // Verificar que no hay reservas superpuestas (excluir canceladas)
    const reservasSuperpuestas = await Reserva.find({
      cancha_id,
      fecha_reserva: fechaReservaDate,
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
    });

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

    console.log(
      `🔒 Creando reserva para usuario: ${decoded.userId} (${decoded.email})`
    );

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
      usuario_id: decoded.userId,
      fecha_reserva: fechaReservaDate,
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

    // Enviar email de confirmación (de forma asíncrona)
    try {
      const usuario = await Usuario.findById(decoded.userId);
      if (usuario && usuario.email) {
        const emailSent = await sendReservationConfirmation(
          usuario.email,
          usuario.nombre_completo || "Usuario",
          {
            canchaName: (nuevaReserva.cancha_id as { nombre: string }).nombre,
            fecha: fechaReservaDate.toISOString(),
            horaInicio: hora_inicio,
            horaFin: hora_fin,
            precio: Number(precio_total),
            metodoPago: metodo_pago || "efectivo",
            reservaId: nuevaReserva._id.toString(),
          }
        );

        if (emailSent) {
          console.log(`📧 Email de confirmación enviado a ${usuario.email}`);
        } else {
          console.log(`❌ Error enviando email a ${usuario.email}`);
        }
      }
    } catch (emailError) {
      console.error("❌ Error enviando email de confirmación:", emailError);
      // No fallar la reserva por errores de email
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
