import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import {
  verifyRefreshToken,
  generateTokenPair,
  getClientIp,
  checkRateLimit,
  securityHeaders,
} from "@/lib/auth";
import {
  createErrorResponse,
  createSuccessResponse,
  AuthenticationError,
} from "@/lib/error-handler";
import Usuario from "@/models/Usuario";

export async function POST(request: NextRequest) {
  const headers = new Headers();

  // Aplicar headers de seguridad
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  try {
    const ip = getClientIp(request);

    // Rate limiting
    if (!checkRateLimit(ip, 5, 5 * 60 * 1000)) {
      // 5 intentos por 5 minutos
      return NextResponse.json(
        createErrorResponse(
          new AuthenticationError("Demasiados intentos. Intenta más tarde")
        ),
        { status: 429, headers }
      );
    }

    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        createErrorResponse(
          new AuthenticationError("Refresh token no encontrado")
        ),
        { status: 401, headers }
      );
    }

    // Verificar refresh token
    const refreshPayload = verifyRefreshToken(refreshToken);

    // Conectar a la base de datos
    await connectToDatabase();

    // Buscar usuario
    const usuario = await Usuario.findById(refreshPayload.userId);
    if (!usuario) {
      return NextResponse.json(
        createErrorResponse(new AuthenticationError("Usuario no encontrado")),
        { status: 401, headers }
      );
    }

    // Generar nuevos tokens
    const tokenPair = generateTokenPair({
      userId: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol,
      cancha_id: usuario.cancha_id?.toString(),
    });

    // Configurar cookies
    const response = NextResponse.json(
      createSuccessResponse({
        user: {
          id: usuario._id,
          email: usuario.email,
          nombre_completo: usuario.nombre_completo,
          rol: usuario.rol,
          cancha_id: usuario.cancha_id,
        },
        expiresIn: tokenPair.expiresIn,
      }),
      { headers }
    );

    // Configurar cookies seguras
    response.cookies.set("accessToken", tokenPair.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutos
      path: "/",
    });

    response.cookies.set("refreshToken", tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en refresh token:", error);

    const response = NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error : new Error("Error interno del servidor")
      ),
      { status: 500, headers }
    );

    // Limpiar cookies en caso de error
    response.cookies.set("accessToken", "", { maxAge: 0 });
    response.cookies.set("refreshToken", "", { maxAge: 0 });

    return response;
  }
}
