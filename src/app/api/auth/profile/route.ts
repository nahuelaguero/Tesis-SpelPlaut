import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import jwt from "jsonwebtoken";
import { ApiResponse } from "@/types";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autorizado - Sin token",
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        rol: string;
      };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido o expirado",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nombre_completo, telefono } = body;

    // Validaciones básicas
    if (!nombre_completo || nombre_completo.trim() === "") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El nombre completo es requerido",
        },
        { status: 400 }
      );
    }

    if (nombre_completo.length < 2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El nombre debe tener al menos 2 caracteres",
        },
        { status: 400 }
      );
    }

    // Validar teléfono si se proporciona
    if (telefono && telefono.trim() !== "") {
      const telefonoRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
      if (!telefonoRegex.test(telefono.trim())) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Formato de teléfono inválido",
          },
          { status: 400 }
        );
      }
    }

    // Buscar y actualizar usuario
    const updatedUser = await Usuario.findByIdAndUpdate(
      decoded.userId,
      {
        nombre_completo: nombre_completo.trim(),
        telefono: telefono ? telefono.trim() : "",
        fecha_actualizacion: new Date(),
      },
      {
        new: true,
        select: "-password", // Excluir la contraseña de la respuesta
      }
    );

    if (!updatedUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    console.log(`✅ Perfil actualizado para usuario: ${updatedUser.email}`);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
