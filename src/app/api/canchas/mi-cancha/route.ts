import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";
import { verify } from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación
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

    let userId: string;
    let userRole: string;
    try {
      const decoded = verify(token, process.env.JWT_SECRET || "secret") as {
        userId: string;
        rol: string;
      };
      userId = decoded.userId;
      userRole = decoded.rol;
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido",
        },
        { status: 401 }
      );
    }

    // Verificar que sea propietario de cancha o admin
    if (userRole !== "propietario_cancha" && userRole !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo propietarios de canchas pueden acceder",
        },
        { status: 403 }
      );
    }

    let cancha;

    if (userRole === "admin") {
      // Admin puede ver todas las canchas, obtener la primera o solicitar ID específico
      const canchas = await Cancha.find().limit(1);
      cancha = canchas[0];
    } else {
      // Propietarios solo ven su cancha
      const usuario = await Usuario.findById(userId);
      if (!usuario || !usuario.cancha_id) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "No tienes una cancha asignada",
          },
          { status: 404 }
        );
      }

      cancha = await Cancha.findById(usuario.cancha_id);
    }

    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha obtenida exitosamente",
      data: cancha,
    });
  } catch (error) {
    console.error("Error obteniendo cancha del propietario:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
