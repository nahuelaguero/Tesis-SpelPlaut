import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { require2FAIfEnabled } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  await connectDB();
  const user = await require2FAIfEnabled(request);
  if (!user) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "No autenticado o código 2FA inválido.",
      },
      { status: 401 }
    );
  }
  // No exponer hash ni códigos 2FA
  const userObj =
    typeof (user as unknown as { toJSON?: () => unknown }).toJSON === "function"
      ? (user as unknown as { toJSON: () => unknown }).toJSON()
      : { ...user };
  const safeUser = userObj as Record<string, unknown>;
  delete safeUser.contrasena_hash;
  delete safeUser.codigo_2fa_email;
  delete safeUser.codigo_2fa_expira;
  return NextResponse.json<ApiResponse>({
    success: true,
    message: "Perfil de usuario",
    data: safeUser,
  });
}

export async function PATCH(request: NextRequest) {
  await connectDB();
  const user = await require2FAIfEnabled(request);
  if (!user) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "No autenticado o código 2FA inválido.",
      },
      { status: 401 }
    );
  }
  const { activar_2fa } = await request.json();
  if (typeof activar_2fa !== "boolean") {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "El campo 'activar_2fa' es requerido y debe ser booleano.",
      },
      { status: 400 }
    );
  }
  user.autenticacion_2FA = activar_2fa;
  if (!activar_2fa) {
    user.codigo_2fa_email = undefined;
    user.codigo_2fa_expira = undefined;
  }
  await (user as unknown as { save?: () => Promise<void> }).save?.();
  return NextResponse.json<ApiResponse>({
    success: true,
    message: activar_2fa
      ? "Verificación en dos pasos (2FA) activada."
      : "Verificación en dos pasos (2FA) desactivada.",
    data: { autenticacion_2FA: user.autenticacion_2FA },
  });
}
