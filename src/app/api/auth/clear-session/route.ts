import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: "Sesión limpiada exitosamente",
    });

    // Limpiar todas las cookies de autenticación
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expira inmediatamente
      path: "/",
    });

    // También limpiar cualquier otra cookie relacionada con auth
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error limpiando sesión:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
