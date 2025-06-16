import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { validate2FACode } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, codigo_2fa } = await request.json();
    if (!email || !codigo_2fa) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Email y código 2FA son requeridos",
        },
        { status: 400 }
      );
    }
    const user = await Usuario.findOne({ email: email.toLowerCase() });
    if (!user || !user.autenticacion_2FA) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado o 2FA no activado",
        },
        { status: 404 }
      );
    }
    const valid = await validate2FACode(user, codigo_2fa);
    if (!valid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Código 2FA inválido o expirado",
        },
        { status: 401 }
      );
    }
    // Generar JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        rol: user.rol,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );
    const userData = {
      _id: user._id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono,
      rol: user.rol,
      autenticacion_2FA: user.autenticacion_2FA,
      preferencias: user.preferencias,
      fecha_registro: user.fecha_registro,
    };
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: "Inicio de sesión exitoso",
      data: { user: userData },
    });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Error en login 2FA:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
