import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token } = body;

    // Validaciones básicas
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token es requerido",
        },
        { status: 400 }
      );
    }

    // Buscar usuario con el token y verificar que no haya expirado
    const usuario = await Usuario.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() }, // Token no expirado
    });

    if (!usuario) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido o expirado",
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Token válido",
    });
  } catch (error) {
    console.error("Error en validate-reset-token:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
