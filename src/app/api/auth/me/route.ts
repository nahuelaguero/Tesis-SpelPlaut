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
    message: "Usuario autenticado",
    data: safeUser,
  });
}
