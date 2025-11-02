import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { getUserFromRequest } from "@/lib/auth";
import { generate2FACode } from "@/lib/utils";
import { send2FAEmail } from "@/lib/email";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email } = body;

    console.log(`[2FA-EMAIL] Solicitud de código 2FA para email: ${email}`);

    // Si no hay email en el body, intentar obtener usuario autenticado
    let user;
    if (email) {
      // Solicitud desde login (sin autenticación)
      user = await Usuario.findOne({ email: email.toLowerCase() });
      if (!user) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Usuario no encontrado.",
          },
          { status: 404 }
        );
      }
    } else {
      // Solicitud desde perfil (con autenticación)
      const userPayload = getUserFromRequest(request);
      if (!userPayload) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "No autenticado. Inicia sesión para solicitar el código.",
          },
          { status: 401 }
        );
      }

      user = await Usuario.findById(userPayload.userId);
      if (!user) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Usuario no encontrado.",
          },
          { status: 404 }
        );
      }
    }
    if (!user.email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El usuario no tiene un email registrado.",
        },
        { status: 400 }
      );
    }

    // Generar código y expiración
    const code = generate2FACode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    user.codigo_2fa_email = code;
    user.codigo_2fa_expira = expires;
    await user.save();

    // Enviar email
    console.log(`[2FA-EMAIL] Enviando código ${code} a ${user.email}`);
    const emailSent = await send2FAEmail(
      user.email,
      user.nombre_completo,
      code
    );
    console.log(`[2FA-EMAIL] Email enviado: ${emailSent}`);

    // En desarrollo, incluir el código en la respuesta para facilitar testing
    const responseData: {
      success: boolean;
      message: string;
      data?: { developmentCode: string; message: string };
    } = {
      success: true,
      message: "Código de verificación enviado a tu correo electrónico.",
    };

    if (process.env.NODE_ENV === "development") {
      responseData.data = {
        developmentCode: code,
        message: "⚠️ SOLO EN DESARROLLO: Código 2FA generado",
      };
    }

    return NextResponse.json<ApiResponse>(responseData);
  } catch (error) {
    console.error("Error enviando código 2FA:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor al enviar el código 2FA.",
      },
      { status: 500 }
    );
  }
}
