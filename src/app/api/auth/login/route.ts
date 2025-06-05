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

    // Validaciones básicas
    if (!email || !password) {
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
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Credenciales inválidas",
        },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      password,
      user.contrasena_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Credenciales inválidas",
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

    // Crear respuesta con datos del usuario (sin contraseña)
    const userData = {
      _id: user._id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono,
      rol: user.rol,
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
    console.error("Error en login:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
