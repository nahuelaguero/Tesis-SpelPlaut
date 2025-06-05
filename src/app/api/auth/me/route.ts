import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get("auth-token")?.value;

    console.log("🔍 Verificando autenticación...");
    console.log("Token encontrado:", token ? "✅ Sí" : "❌ No");

    if (!token) {
      console.log("❌ No se encontró token de autenticación");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autorizado - Sin token",
        },
        { status: 401 }
      );
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as { userId: string; email: string; rol: string };
      console.log(
        "✅ Token verificado exitosamente para usuario:",
        decoded.email
      );
    } catch (jwtError) {
      console.log("❌ Error verificando token:", jwtError);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido o expirado",
        },
        { status: 401 }
      );
    }

    if (!decoded.userId) {
      console.log("❌ Token no contiene userId");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido - Sin userId",
        },
        { status: 401 }
      );
    }

    // Conectar a la base de datos
    await connectDB();

    // Buscar usuario
    const user = await Usuario.findById(decoded.userId).select(
      "-contrasena_hash"
    );

    if (!user) {
      console.log(
        "❌ Usuario no encontrado en la base de datos:",
        decoded.userId
      );
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    console.log("✅ Usuario autenticado exitosamente:", user.email);
    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuario autenticado",
      data: { user },
    });
  } catch (error) {
    console.error("❌ Error verificando autenticación:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
