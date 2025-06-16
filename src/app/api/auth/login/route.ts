import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { LoginCredentials, ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Log seguro - solo email, NUNCA la contraseña
    console.log(`[LOGIN] Intento de login para email: ${email}`);

    // Validaciones básicas
    if (!email || !password) {
      console.log(
        `[LOGIN] Faltan credenciales - email: ${!!email}, password: ${!!password}`
      );
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Email y contraseña son requeridos",
        },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const user = await Usuario.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`[LOGIN] Usuario no encontrado para email: ${email}`);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Credenciales inválidas",
        },
        { status: 401 }
      );
    }

    console.log(
      `[LOGIN] Usuario encontrado - ID: ${user._id}, Rol: ${user.rol}, 2FA: ${user.autenticacion_2FA}`
    );

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      password,
      user.contrasena_hash
    );

    console.log(`[LOGIN] Validación de contraseña: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log(`[LOGIN] Contraseña inválida para usuario: ${user._id}`);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Credenciales inválidas",
        },
        { status: 401 }
      );
    }

    // Si el usuario tiene 2FA activado, no emitir JWT aún
    if (user.autenticacion_2FA) {
      console.log(`[LOGIN] 2FA requerido para usuario: ${user._id}`);
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Credenciales válidas. Se requiere código 2FA.",
          twoFARequired: true,
          data: {
            email: user.email,
            requiresTwoFA: true,
          },
        },
        { status: 200 }
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

    console.log(`[LOGIN] Login exitoso para usuario: ${user._id}`);

    // Crear respuesta con datos del usuario (sin contraseña)
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

    // Configurar cookie del token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[LOGIN] Error en login:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
