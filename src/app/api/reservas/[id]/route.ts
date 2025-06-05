import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

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
    const { estado, pagado } = body;

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

    // Actualizar reserva
    const updatedReserva = await Reserva.findByIdAndUpdate(
      id,
      {
        ...(estado && { estado }),
        ...(typeof pagado === "boolean" && { pagado }),
      },
      { new: true, runValidators: true }
    )
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
