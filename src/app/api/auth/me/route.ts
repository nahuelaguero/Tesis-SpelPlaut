import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";
import Usuario from "@/models/Usuario";

export async function GET(request: NextRequest) {
  await connectDB();

  // Para verificar sesión, solo necesitamos autenticación básica (sin 2FA)
  const userPayload = requireAuth(request);
  if (!userPayload) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "No autenticado.",
      },
      { status: 401 }
    );
  }

  try {
    // Buscar el usuario en la base de datos
    const user = await Usuario.findById(userPayload.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado.",
        },
        { status: 404 }
      );
    }

    // No exponer hash ni códigos 2FA
    const userObj = user.toJSON();
    const safeUser = userObj as Record<string, unknown>;
    delete safeUser.contrasena_hash;
    delete safeUser.codigo_2fa_email;
    delete safeUser.codigo_2fa_expira;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuario autenticado",
      data: safeUser,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
