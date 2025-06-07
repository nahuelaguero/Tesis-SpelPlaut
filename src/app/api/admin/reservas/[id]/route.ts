import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { ApiResponse } from "@/types";
import { verify } from "jsonwebtoken";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Await params
    const { id } = await params;

    // Verificar autenticación y permisos de admin
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token de autenticación requerido",
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET || "secret") as {
        userId: string;
        rol: string;
      };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido",
        },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    if (decoded.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo los administradores pueden acceder",
        },
        { status: 403 }
      );
    }

    const { estado } = await request.json();

    // Validar estado
    const estadosValidos = [
      "pendiente",
      "confirmada",
      "cancelada",
      "completada",
    ];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Estado inválido",
        },
        { status: 400 }
      );
    }

    // Actualizar la reserva
    const reservaActualizada = await Reserva.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    )
      .populate("usuario_id", "nombre_completo email telefono")
      .populate("cancha_id", "nombre ubicacion");

    if (!reservaActualizada) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Estado de reserva actualizado exitosamente",
      data: { reserva: reservaActualizada },
    });
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
