import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";
import { verify } from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

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

    // Obtener todos los usuarios
    const usuarios = await Usuario.find({})
      .select("-contrasena_hash -reset_password_token -reset_password_expires")
      .sort({ fecha_registro: -1 });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuarios obtenidos exitosamente",
      data: { usuarios },
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
