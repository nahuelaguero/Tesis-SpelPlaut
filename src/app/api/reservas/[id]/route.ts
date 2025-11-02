import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Usuario from "@/models/Usuario";
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { sendReservationCancellation } from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de reserva inválido",
        },
        { status: 400 }
      );
    }

    const reserva = await Reserva.findById(id)
      .populate("cancha_id", "nombre tipo ubicacion precio_hora")
      .populate("usuario_id", "nombre_completo email telefono");

    if (!reserva) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar que el usuario puede ver esta reserva
    if (
      user.rol !== "admin" &&
      reserva.usuario_id._id.toString() !== user.userId
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No tienes permiso para ver esta reserva",
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reserva obtenida exitosamente",
      data: { reserva },
    });
  } catch (error) {
    console.error("Error al obtener reserva:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de reserva inválido",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      estado,
      pagado,
      fecha_reserva,
      hora_inicio,
      hora_fin,
      duracion_horas,
      precio_total,
      notas,
    } = body;

    // Verificar que la reserva existe
    const reserva = await Reserva.findById(id).populate("cancha_id");
    if (!reserva) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar permisos
    const isOwner = reserva.usuario_id.toString() === user.userId;
    const isAdmin = user.rol === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No tienes permiso para modificar esta reserva",
        },
        { status: 403 }
      );
    }

    // Validar cambios de estado
    if (estado) {
      const estadosValidos = ["confirmada", "pendiente", "cancelada"];
      if (!estadosValidos.includes(estado)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message:
              "Estado inválido. Debe ser: confirmada, pendiente o cancelada",
          },
          { status: 400 }
        );
      }

      // Solo admin puede confirmar reservas
      if (estado === "confirmada" && !isAdmin) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Solo administradores pueden confirmar reservas",
          },
          { status: 403 }
        );
      }

      // No se puede cancelar una reserva ya confirmada y pagada sin ser admin
      if (
        estado === "cancelada" &&
        reserva.estado === "confirmada" &&
        reserva.pagado &&
        !isAdmin
      ) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message:
              "No se puede cancelar una reserva confirmada y pagada. Contacta al administrador",
          },
          { status: 400 }
        );
      }
    }

    // Validar cambios de pago
    if (typeof pagado === "boolean") {
      // Solo admin puede cambiar el estado de pago
      if (!isAdmin) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Solo administradores pueden cambiar el estado de pago",
          },
          { status: 403 }
        );
      }
    }

    // Validaciones para modificación de reserva
    if (fecha_reserva || hora_inicio || hora_fin) {
      // Solo el propietario puede modificar fecha/hora (no admin por ahora)
      if (!isOwner) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Solo puedes modificar tus propias reservas",
          },
          { status: 403 }
        );
      }

      // No se puede modificar una reserva cancelada
      if (reserva.estado === "cancelada") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "No se puede modificar una reserva cancelada",
          },
          { status: 400 }
        );
      }

      // No modificar si está confirmada y pagada
      if (reserva.estado === "confirmada" && reserva.pagado) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "No se puede modificar una reserva confirmada y pagada",
          },
          { status: 400 }
        );
      }

      // Validar que la fecha sea futura
      if (fecha_reserva) {
        const today = new Date().toISOString().split("T")[0];
        if (fecha_reserva < today) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "No se pueden programar reservas para fechas pasadas",
            },
            { status: 400 }
          );
        }
      }

      // Validar horarios si se proporcionan
      if (hora_inicio && hora_fin) {
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

        const [inicioHour, inicioMin] = hora_inicio.split(":").map(Number);
        const [finHour, finMin] = hora_fin.split(":").map(Number);
        const inicioMinutos = inicioHour * 60 + inicioMin;
        const finMinutos = finHour * 60 + finMin;

        if (finMinutos <= inicioMinutos) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "La hora de fin debe ser posterior a la hora de inicio",
            },
            { status: 400 }
          );
        }

        if (finMinutos - inicioMinutos < 30) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "La reserva debe ser de al menos 30 minutos",
            },
            { status: 400 }
          );
        }
      }

      // Verificar disponibilidad si se cambian fecha/hora
      if (fecha_reserva || hora_inicio || hora_fin) {
        const nuevaFecha = fecha_reserva
          ? new Date(fecha_reserva + "T00:00:00.000")
          : reserva.fecha_reserva;
        const nuevaHoraInicio = hora_inicio || reserva.hora_inicio;
        const nuevaHoraFin = hora_fin || reserva.hora_fin;

        // Verificar que no hay reservas superpuestas (excluyendo la actual y canceladas)
        const reservasSuperpuestas = await Reserva.find({
          _id: { $ne: id }, // Excluir la reserva actual
          cancha_id: reserva.cancha_id._id,
          fecha_reserva: nuevaFecha,
          estado: { $ne: "cancelada" },
          $or: [
            {
              $and: [
                { hora_inicio: { $lte: nuevaHoraInicio } },
                { hora_fin: { $gt: nuevaHoraInicio } },
              ],
            },
            {
              $and: [
                { hora_inicio: { $lt: nuevaHoraFin } },
                { hora_fin: { $gte: nuevaHoraFin } },
              ],
            },
            {
              $and: [
                { hora_inicio: { $gte: nuevaHoraInicio } },
                { hora_fin: { $lte: nuevaHoraFin } },
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
      }
    }

    // Actualizar reserva
    const updateData: Record<string, unknown> = {};

    if (estado) updateData.estado = estado;
    if (typeof pagado === "boolean") updateData.pagado = pagado;
    if (fecha_reserva)
      updateData.fecha_reserva = new Date(fecha_reserva + "T00:00:00.000");
    if (hora_inicio) updateData.hora_inicio = hora_inicio;
    if (hora_fin) updateData.hora_fin = hora_fin;
    if (duracion_horas) updateData.duracion_horas = duracion_horas;
    if (precio_total) updateData.precio_total = precio_total;
    if (notas !== undefined) updateData.notas = notas;

    const updatedReserva = await Reserva.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("cancha_id", "nombre tipo ubicacion precio_hora")
      .populate("usuario_id", "nombre_completo email telefono");

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reserva actualizada exitosamente",
      data: { reserva: updatedReserva },
    });
  } catch (error) {
    console.error("Error al actualizar reserva:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Datos de entrada inválidos",
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de reserva inválido",
        },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reserva = await Reserva.findById(id);
    if (!reserva) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar permisos
    const isOwner = reserva.usuario_id.toString() === user.userId;
    const isAdmin = user.rol === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No tienes permiso para cancelar esta reserva",
        },
        { status: 403 }
      );
    }

    // No permitir cancelar si ya está pagada y confirmada (solo admin puede)
    if (reserva.estado === "confirmada" && reserva.pagado && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "No se puede cancelar una reserva confirmada y pagada. Contacta al administrador",
        },
        { status: 400 }
      );
    }

    // En lugar de eliminar, cambiar estado a 'cancelada'
    const updatedReserva = await Reserva.findByIdAndUpdate(
      id,
      { estado: "cancelada" },
      { new: true }
    )
      .populate("cancha_id", "nombre tipo ubicacion precio_hora")
      .populate("usuario_id", "nombre_completo email telefono");

    // Enviar email de cancelación (de forma asíncrona)
    try {
      const usuario = await Usuario.findById(reserva.usuario_id);
      if (usuario && usuario.email && updatedReserva) {
        const emailSent = await sendReservationCancellation(
          usuario.email,
          usuario.nombre_completo || "Usuario",
          {
            canchaName: (updatedReserva.cancha_id as { nombre: string }).nombre,
            fecha: updatedReserva.fecha_reserva.toISOString(),
            horaInicio: updatedReserva.hora_inicio,
            horaFin: updatedReserva.hora_fin,
            reservaId: updatedReserva._id.toString(),
            refundAmount: reserva.pagado
              ? updatedReserva.precio_total
              : undefined,
          }
        );

        if (emailSent) {
          console.log(`📧 Email de cancelación enviado a ${usuario.email}`);
        } else {
          console.log(
            `❌ Error enviando email de cancelación a ${usuario.email}`
          );
        }
      }
    } catch (emailError) {
      console.error("❌ Error enviando email de cancelación:", emailError);
      // No fallar la cancelación por errores de email
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reserva cancelada exitosamente",
      data: { reserva: updatedReserva },
    });
  } catch (error) {
    console.error("Error al cancelar reserva:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
