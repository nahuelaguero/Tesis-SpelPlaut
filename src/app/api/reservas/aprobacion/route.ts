import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cancha from "@/models/Cancha";
import { ApiResponse } from "@/types";
import { isValidObjectId, requireAuth } from "@/lib/auth";
import {
  sendReservationConfirmation,
  sendReservationRejected,
} from "@/lib/email";

async function getOwnerCanchas(userId: string) {
  return Cancha.find({ propietario_id: userId }).select("_id nombre").lean();
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    if (auth.rol !== "propietario_cancha" && auth.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autorizado." },
        { status: 403 }
      );
    }

    const canchaId = new URL(request.url).searchParams.get("cancha_id");
    const ownerCanchas =
      auth.rol === "admin"
        ? canchaId && isValidObjectId(canchaId)
          ? [{ _id: canchaId, nombre: "" }]
          : await Cancha.find().select("_id nombre").lean()
        : await getOwnerCanchas(auth.userId);

    const canchaIds = ownerCanchas.map((cancha) => cancha._id);

    const reservations = await Reserva.find({
      cancha_id: { $in: canchaIds },
      estado: { $in: ["pendiente", "pendiente_aprobacion"] },
    })
      .populate("usuario_id", "nombre_completo email")
      .populate("cancha_id", "nombre")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas pendientes obtenidas exitosamente.",
      data: {
        reservas: reservations.map((reservation) => ({
          _id: reservation._id.toString(),
          fecha: reservation.fecha,
          hora_inicio: reservation.hora_inicio,
          hora_fin: reservation.hora_fin,
          precio_total: reservation.precio_total,
          metodo_pago: reservation.metodo_pago,
          cancha_nombre: (reservation.cancha_id as { nombre: string }).nombre,
          usuario: {
            nombre_completo: (
              reservation.usuario_id as { nombre_completo: string }
            ).nombre_completo,
            email: (reservation.usuario_id as { email: string }).email,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo reservas pendientes:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    if (auth.rol !== "propietario_cancha" && auth.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autorizado." },
        { status: 403 }
      );
    }

    const { reserva_id, accion, motivo } = await request.json();

    if (!reserva_id || !isValidObjectId(reserva_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de reserva inválido." },
        { status: 400 }
      );
    }

    if (!accion || !["aprobar", "rechazar"].includes(accion)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La acción debe ser aprobar o rechazar." },
        { status: 400 }
      );
    }

    const reservation = await Reserva.findById(reserva_id)
      .populate("cancha_id", "nombre propietario_id")
      .populate("usuario_id", "nombre_completo email")
      .lean();

    if (!reservation) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Reserva no encontrada." },
        { status: 404 }
      );
    }

    const cancha = reservation.cancha_id as { _id: string; nombre: string; propietario_id: string };
    if (auth.rol !== "admin" && cancha.propietario_id.toString() !== auth.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No puedes gestionar esta reserva." },
        { status: 403 }
      );
    }

    if (!["pendiente", "pendiente_aprobacion"].includes(reservation.estado)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "La reserva ya fue procesada." },
        { status: 400 }
      );
    }

    const newState = accion === "aprobar" ? "confirmada" : "rechazada";

    const updatedReservation = await Reserva.findByIdAndUpdate(
      reserva_id,
      {
        estado: newState,
        aprobada_por_propietario: accion === "aprobar",
        fecha_decision: new Date(),
        motivo_rechazo: accion === "rechazar" ? motivo || undefined : undefined,
      },
      { new: true }
    );

    const customer = reservation.usuario_id as {
      nombre_completo: string;
      email: string;
    };

    if (customer.email) {
      if (accion === "aprobar") {
        void sendReservationConfirmation(customer.email, customer.nombre_completo || "Usuario", {
          canchaName: cancha.nombre,
          fecha: `${reservation.fecha}T00:00:00.000Z`,
          horaInicio: reservation.hora_inicio,
          horaFin: reservation.hora_fin,
          precio: reservation.precio_total,
          metodoPago: reservation.metodo_pago || "efectivo",
          reservaId: reservation._id.toString(),
        }).catch((emailError) => {
          console.error("Error enviando confirmación al aprobar reserva:", emailError);
        });
      } else {
        void sendReservationRejected(customer.email, customer.nombre_completo || "Usuario", {
          canchaName: cancha.nombre,
          fecha: `${reservation.fecha}T00:00:00.000Z`,
          horaInicio: reservation.hora_inicio,
          horaFin: reservation.hora_fin,
          motivo,
        }).catch((emailError) => {
          console.error("Error enviando rechazo de reserva:", emailError);
        });
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message:
        accion === "aprobar"
          ? "Reserva aprobada exitosamente."
          : "Reserva rechazada exitosamente.",
      data: { reserva: updatedReservation },
    });
  } catch (error) {
    console.error("Error procesando aprobación de reserva:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
