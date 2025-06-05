import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { RegisterData, ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: RegisterData = await request.json();
    const { nombre_completo, email, telefono, password } = body;

    // Validaciones básicas
    if (!nombre_completo || !email || !telefono || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Todos los campos son requeridos",
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

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Ya existe un usuario con este email",
        },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const contrasena_hash = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const newUser = new Usuario({
      nombre_completo,
      email: email.toLowerCase(),
      telefono,
      contrasena_hash,
      rol: "usuario",
      autenticacion_2FA: false,
      preferencias: {
        tema: "claro",
        notificaciones: true,
      },
    });

    await newUser.save();

    // Respuesta exitosa (sin devolver datos sensibles)
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          user: {
            _id: newUser._id,
            nombre_completo: newUser.nombre_completo,
            email: newUser.email,
            telefono: newUser.telefono,
            rol: newUser.rol,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);

    // Manejar errores de validación de MongoDB
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Datos de entrada inválidos",
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
