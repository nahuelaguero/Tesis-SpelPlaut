import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
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

    // Por ahora devolvemos un array vacío ya que no tenemos el modelo Reserva implementado
    // TODO: Cuando implementemos el modelo Reserva, aquí haremos:
    // const reservas = await Reserva.find({ usuario: decoded.userId }).populate('cancha');
    console.log("Usuario autenticado para reservas:", decoded.userId);

    const reservas: never[] = [];

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas obtenidas exitosamente",
      data: {
        reservas,
        total: reservas.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);
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
