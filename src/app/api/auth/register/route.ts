import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { RegisterData, ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verificar que sea administrador
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Acceso denegado. Solo administradores pueden crear usuarios",
        },
        { status: 403 }
      );
    }

    const body: RegisterData = await request.json();
    const { nombre_completo, email, telefono, password, rol } = body;

    console.log(
      `[REGISTER] Admin ${admin.email} creando usuario para email: ${email}`
    );

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

    // Validar rol si se proporciona
    const rolesValidos = ["usuario", "propietario_cancha", "admin"];
    const rolFinal = rol && rolesValidos.includes(rol) ? rol : "usuario";

    // Verificar si el email ya existe
    const existingUser = await Usuario.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`[REGISTER] Email ya existe: ${email}`);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El email ya está registrado",
        },
        { status: 409 }
      );
    }

    // Hashear la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el nuevo usuario
    const newUser = new Usuario({
      nombre_completo: nombre_completo.trim(),
      email: email.toLowerCase().trim(),
      telefono: telefono.trim(),
      contrasena_hash: hashedPassword,
      rol: rolFinal,
      autenticacion_2FA: false,
      preferencias: {
        tema: "claro",
        notificaciones: true,
      },
      fecha_registro: new Date(),
    });

    await newUser.save();

    console.log(
      `[REGISTER] Usuario creado exitosamente por admin ${admin.email} - ID: ${newUser._id}, Email: ${email}, Rol: ${rolFinal}`
    );

    // Respuesta exitosa (sin devolver información sensible)
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Usuario creado exitosamente",
        data: {
          user: {
            _id: newUser._id,
            nombre_completo: newUser.nombre_completo,
            email: newUser.email,
            telefono: newUser.telefono,
            rol: newUser.rol,
            fecha_registro: newUser.fecha_registro,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Error en registro:", error);

    // Verificar si es un error de duplicado (por si el índice único falla)
    if ((error as any).code === 11000) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El email ya está registrado",
        },
        { status: 409 }
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
