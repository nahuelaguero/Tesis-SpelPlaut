import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { RegisterData, ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: RegisterData = await request.json();
    const { nombre_completo, email, telefono, password, rol } = body;

    console.log(
      `[REGISTER] Intento de registro para email: ${email} con rol: ${
        rol || "usuario"
      }`,
    );

    // Validaciones básicas
    if (!nombre_completo || !email || !telefono || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Todos los campos son requeridos",
        },
        { status: 400 },
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
        { status: 400 },
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres",
        },
        { status: 400 },
      );
    }

    // Determinar el rol y verificar permisos
    let rolFinal = "usuario"; // Por defecto siempre es usuario para registro público

    // Si se especifica un rol que no sea "usuario", verificar que sea admin
    if (rol && rol !== "usuario") {
      const admin = requireAdmin(request);
      if (!admin) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message:
              "Solo los administradores pueden crear usuarios con roles especiales",
          },
          { status: 403 },
        );
      }

      // Validar que el rol sea válido
      const rolesValidos = ["usuario", "propietario_cancha", "admin"];
      if (rolesValidos.includes(rol)) {
        rolFinal = rol;
        console.log(
          `[REGISTER] Admin ${admin.email} creando usuario con rol: ${rolFinal}`,
        );
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Rol inválido",
          },
          { status: 400 },
        );
      }
    }

    // Verificar si el email ya existe
    const existingUser = await Usuario.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`[REGISTER] Email ya existe: ${email}`);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El email ya está registrado",
        },
        { status: 409 },
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
      `[REGISTER] Usuario creado exitosamente - ID: ${newUser._id}, Email: ${email}, Rol: ${rolFinal}`,
    );

    // Respuesta exitosa (sin devolver información sensible)
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message:
          rolFinal === "usuario"
            ? "Cuenta creada exitosamente"
            : "Usuario creado exitosamente",
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
      { status: 201 },
    );
  } catch (error) {
    console.error("[REGISTER] Error en registro:", error);

    // Verificar si es un error de duplicado (por si el índice único falla)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El email ya está registrado",
        },
        { status: 409 },
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
