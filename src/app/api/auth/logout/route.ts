import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function POST() {
  try {
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: "Sesión cerrada exitosamente",
    });

    // Eliminar la cookie de autenticación
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expira inmediatamente
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
