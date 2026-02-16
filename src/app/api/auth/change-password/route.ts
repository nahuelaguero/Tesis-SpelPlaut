import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/types";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

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
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        rol: string;
      };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido o expirado",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    // Validaciones básicas
    if (!current_password || !new_password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Se requiere la contraseña actual y la nueva contraseña",
        },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La nueva contraseña debe tener al menos 6 caracteres",
        },
        { status: 400 }
      );
    }

    // Buscar usuario con contraseña incluida
    const user = await Usuario.findById(decoded.userId).select("+contrasena_hash");

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      user.contrasena_hash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La contraseña actual es incorrecta",
        },
        { status: 400 }
      );
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(new_password, user.contrasena_hash);

    if (isSamePassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La nueva contraseña debe ser diferente a la actual",
        },
        { status: 400 }
      );
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Actualizar contraseña
    await Usuario.findByIdAndUpdate(decoded.userId, {
      contrasena_hash: hashedNewPassword,
      fecha_actualizacion: new Date(),
    });

    console.log(`🔐 Contraseña cambiada para usuario: ${user.email}`);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Contraseña cambiada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
