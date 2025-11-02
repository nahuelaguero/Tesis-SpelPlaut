import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    // Validaciones básicas
    if (!email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El email es requerido",
        },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Formato de email inválido",
        },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    // Por seguridad, siempre devolvemos success=true, incluso si el email no existe
    // Esto previene ataques de enumeración de usuarios
    if (!usuario) {
      console.log(
        `🔍 Intento de recuperación para email no registrado: ${email}`
      );
      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Si el email está registrado, recibirás las instrucciones",
      });
    }

    // Generar token único para reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en la base de datos
    await Usuario.findByIdAndUpdate(usuario._id, {
      reset_password_token: resetToken,
      reset_password_expires: resetTokenExpiry,
    });

    // Construir URL de reset
    const resetUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // Enviar email de recuperación
    try {
      const { sendPasswordResetEmail } = await import("@/lib/email");

      const emailSent = await sendPasswordResetEmail(
        usuario.email,
        usuario.nombre_completo || "Usuario",
        {
          resetUrl,
          userName: usuario.nombre_completo || "Usuario",
          expiresIn: "1 hora",
        }
      );

      if (emailSent) {
        console.log(`📧 Email de recuperación enviado a ${usuario.email}`);
      } else {
        console.error(
          `❌ Error enviando email de recuperación a ${usuario.email}`
        );
        // No revelamos el error al usuario por seguridad
      }
    } catch (emailError) {
      console.error("❌ Error enviando email de recuperación:", emailError);
      // Continuamos sin fallar, por seguridad
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Si el email está registrado, recibirás las instrucciones",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
