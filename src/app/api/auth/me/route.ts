import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { ApiResponse } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

type AuthLookup =
  | { status: "authenticated"; userId: string }
  | { status: "anonymous" }
  | { status: "invalid" };

async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthLookup> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return { status: "anonymous" };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload.userId === "string") {
      return { status: "authenticated", userId: payload.userId };
    }

    return { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
}

export async function GET(request: NextRequest) {
  const userPayload = await getAuthenticatedUser(request);

  if (userPayload.status === "anonymous") {
    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Sin sesión activa.",
      data: null,
    });
  }

  if (userPayload.status === "invalid") {
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: "Sesión inválida limpiada.",
      data: null,
    });
    response.cookies.delete("auth-token");
    return response;
  }

  try {
    const [{ default: connectDB }, { default: Usuario }] = await Promise.all([
      import("@/lib/mongodb"),
      import("@/models/Usuario"),
    ]);

    await connectDB();

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

    if (user.bloqueado) {
      const response = NextResponse.json<ApiResponse>({
        success: true,
        message: "Usuario bloqueado. Sesión cerrada.",
        data: null,
      });
      response.cookies.delete("auth-token");
      return response;
    }

    // No exponer secretos ni datos internos del canal push.
    const userObj = user.toJSON();
    const safeUser = userObj as Record<string, unknown>;
    delete safeUser.contrasena_hash;
    delete safeUser.codigo_2fa_email;
    delete safeUser.codigo_2fa_expira;
    delete safeUser.reset_password_token;
    delete safeUser.reset_password_expires;
    delete safeUser.push_subscriptions;

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
