import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, password } = body;

    // Validaciones básicas
    if (!token || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token y contraseña son requeridos",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
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

    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Actualizar contraseña y limpiar tokens de reset
    await Usuario.findByIdAndUpdate(usuario._id, {
      contrasena_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    console.log(`🔐 Contraseña actualizada para usuario: ${usuario.email}`);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
