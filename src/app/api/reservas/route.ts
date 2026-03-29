import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import Usuario from "@/models/Usuario";
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse, type Usuario as UsuarioDoc, type Cancha as CanchaDoc } from "@/types";
import {
  calculateReservationPrice,
  getDayName,
  isTimeAligned,
  sanitizeInterval,
  timeToMinutes,
} from "@/lib/pricing";
import {
  sendOwnerReservationPendingApproval,
  sendReservationConfirmation,
  sendReservationPendingApproval,
} from "@/lib/email";
import { sendPushToUser } from "@/lib/webpush";

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

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

    const user = await Usuario.findById(userPayload.userId).lean() as unknown as UsuarioDoc | null;
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Usuario no encontrado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cancha_id = searchParams.get("cancha_id");
    const fecha = searchParams.get("fecha");
    const estado = searchParams.get("estado");

    const filters: Record<string, unknown> = {};

    if (user.rol !== "admin") {
      filters.usuario_id = user._id;
    }

    if (cancha_id) {
      if (!isValidObjectId(cancha_id)) {
        return NextResponse.json<ApiResponse>(
          { success: false, message: "ID de cancha inválido" },
          { status: 400 }
        );
      }
      filters.cancha_id = cancha_id;
    }

    if (fecha) {
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
      .populate("cancha_id", "nombre tipo_cancha ubicacion precio_por_hora")
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
      metodo_pago,
      notas,
      numero_jugadores,
    } = body;

    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de cancha inválido." },
        { status: 400 }
      );
    }

    if (!fecha_reserva || !hora_inicio || !hora_fin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Fecha, hora de inicio y hora de fin son obligatorias.",
        },
        { status: 400 }
      );
    }

    const [user, cancha] = await Promise.all([
      Usuario.findById(userPayload.userId).lean() as unknown as UsuarioDoc | null,
      Cancha.findById(cancha_id).lean() as unknown as CanchaDoc | null,
    ]);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Usuario no encontrado." },
        { status: 401 }
      );
    }

    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Cancha no encontrada." },
        { status: 404 }
      );
    }

    if (!cancha.disponible) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La cancha no está disponible." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_reserva)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La fecha debe tener formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const selectedDate = new Date(`${fecha_reserva}T00:00:00`);
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (fecha_reserva < todayString) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se pueden hacer reservas para fechas pasadas.",
        },
        { status: 400 }
      );
    }

    const intervalMinutes = sanitizeInterval(cancha.intervalo_reserva_minutos);
    const openingMinutes = timeToMinutes(cancha.horario_apertura);
    const isAlignedFromOpening = (time: string) =>
      (timeToMinutes(time) - openingMinutes) % intervalMinutes === 0;
    if (!isAlignedFromOpening(hora_inicio) || !isAlignedFromOpening(hora_fin)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Los horarios deben respetar intervalos de ${intervalMinutes} minutos.`,
        },
        { status: 400 }
      );
    }

    const startMinutes = timeToMinutes(hora_inicio);
    const endMinutes = timeToMinutes(hora_fin);

    if (endMinutes <= startMinutes) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La hora de fin debe ser posterior a la de inicio.",
        },
        { status: 400 }
      );
    }

    if ((endMinutes - startMinutes) % intervalMinutes !== 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `La duración debe ser múltiplo de ${intervalMinutes} minutos.`,
        },
        { status: 400 }
      );
    }

    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    if (fecha_reserva === todayString && startMinutes <= nowMinutes) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No puedes reservar un horario que ya pasó.",
        },
        { status: 400 }
      );
    }

    const openingMinutes = timeToMinutes(cancha.horario_apertura);
    const closingMinutes = timeToMinutes(cancha.horario_cierre);
    if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Los horarios deben estar entre ${cancha.horario_apertura} y ${cancha.horario_cierre}.`,
        },
        { status: 400 }
      );
    }

    const dayName = getDayName(fecha_reserva);
    if (!cancha.dias_operativos.includes(dayName)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `La cancha no opera los ${dayName}s.`,
        },
        { status: 400 }
      );
    }

    const blockedDate = cancha.disponibilidad?.find(
      (item) => item.fecha === fecha_reserva && !item.disponible
    );
    if (blockedDate) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: blockedDate.motivo || "La cancha no está disponible para esa fecha.",
        },
        { status: 400 }
      );
    }

    if (
      numero_jugadores &&
      Number(numero_jugadores) > Number(cancha.capacidad_jugadores)
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Capacidad máxima: ${cancha.capacidad_jugadores} jugadores.`,
        },
        { status: 400 }
      );
    }

    const overlappingReservations = await Reserva.find({
      cancha_id,
      fecha: fecha_reserva,
      estado: { $in: ["pendiente", "pendiente_aprobacion", "confirmada"] },
    })
      .select("hora_inicio hora_fin")
      .lean();

    const hasConflict = overlappingReservations.some((reservation) =>
      hasTimeConflict(
        hora_inicio,
        hora_fin,
        reservation.hora_inicio,
        reservation.hora_fin
      )
    );

    if (hasConflict) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Ya existe una reserva en el horario seleccionado.",
        },
        { status: 409 }
      );
    }

    const validPaymentMethods = [
      "efectivo",
      "bancard_card",
      "bancard_apple_pay",
      "bancard_google_pay",
      "bancard_qr",
    ];

    if (metodo_pago && !validPaymentMethods.includes(metodo_pago)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Método de pago no válido.",
        },
        { status: 400 }
      );
    }

    const priceInfo = calculateReservationPrice({
      cancha,
      fecha: fecha_reserva,
      horaInicio: hora_inicio,
      horaFin: hora_fin,
    });

    const duracion_horas = priceInfo.durationMinutes / 60;
    const estado = cancha.aprobacion_automatica === false ? "pendiente_aprobacion" : "confirmada";

    const nuevaReserva = await Reserva.create({
      cancha_id,
      usuario_id: user._id,
      fecha: fecha_reserva,
      fecha_reserva: selectedDate,
      hora_inicio,
      hora_fin,
      duracion_horas,
      precio_total: priceInfo.total,
      metodo_pago: metodo_pago || "efectivo",
      notas: notas || undefined,
      numero_jugadores: numero_jugadores ? Number(numero_jugadores) : undefined,
      pagado: false,
      aprobada_por_propietario: cancha.aprobacion_automatica !== false,
      estado,
    });

    await nuevaReserva.populate([
      { path: "cancha_id", select: "nombre tipo_cancha ubicacion propietario_id" },
      { path: "usuario_id", select: "nombre_completo email" },
    ]);

    if (user.email) {
      if (estado === "confirmada") {
        void sendReservationConfirmation(user.email, user.nombre_completo || "Usuario", {
          canchaName: (nuevaReserva.cancha_id as { nombre: string }).nombre,
          fecha: selectedDate.toISOString(),
          horaInicio: hora_inicio,
          horaFin: hora_fin,
          precio: priceInfo.total,
          metodoPago: metodo_pago || "efectivo",
          reservaId: nuevaReserva._id.toString(),
        }).catch((emailError) => {
          console.error("Error enviando email de confirmación:", emailError);
        });
      } else {
        void sendReservationPendingApproval(user.email, user.nombre_completo || "Usuario", {
          canchaName: (nuevaReserva.cancha_id as { nombre: string }).nombre,
          fecha: selectedDate.toISOString(),
          horaInicio: hora_inicio,
          horaFin: hora_fin,
          precio: priceInfo.total,
          reservaId: nuevaReserva._id.toString(),
        }).catch((emailError) => {
          console.error("Error enviando email de reserva pendiente:", emailError);
        });
      }
    }

    void sendPushToUser(user._id!.toString(), {
      title: estado === "confirmada" ? "Reserva confirmada ✅" : "Reserva pendiente ⏳",
      body: `${(nuevaReserva.cancha_id as { nombre: string }).nombre} — ${hora_inicio} a ${hora_fin}`,
      url: "/",
      tag: "reserva-creada",
    }).catch((err) => console.error("Push error:", err));

    if (estado === "pendiente_aprobacion") {
      const owner = await Usuario.findById(
        (nuevaReserva.cancha_id as { propietario_id?: string }).propietario_id
      ).lean() as unknown as UsuarioDoc | null;

      if (owner) {
        if (owner.email) {
          void sendOwnerReservationPendingApproval(
            owner.email,
            owner.nombre_completo || "Propietario",
            {
              canchaName: (nuevaReserva.cancha_id as { nombre: string }).nombre,
              fecha: selectedDate.toISOString(),
              horaInicio: hora_inicio,
              horaFin: hora_fin,
              precio: priceInfo.total,
              reservaId: nuevaReserva._id.toString(),
              customerName: user.nombre_completo || "Usuario",
              customerEmail: user.email,
            }
          ).catch((emailError) => {
            console.error("Error enviando email al propietario:", emailError);
          });
        }
        void sendPushToUser(owner._id!.toString(), {
          title: "Nueva reserva pendiente 🔔",
          body: `${user.nombre_completo || "Un usuario"} quiere reservar ${hora_inicio}–${hora_fin}`,
          url: "/mi-cancha",
          tag: "reserva-pendiente",
        }).catch((err) => console.error("Push owner error:", err));
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message:
          estado === "confirmada"
            ? "Reserva creada y confirmada exitosamente."
            : "Reserva creada y pendiente de aprobación del propietario.",
        data: { reserva: nuevaReserva },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear reserva:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
