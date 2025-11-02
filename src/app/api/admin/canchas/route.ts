import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";
import Usuario from "@/models/Usuario";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verificar autenticación
    const userPayload = requireAuth(request);
    if (!userPayload) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autenticado.",
        },
        { status: 401 }
      );
    }

    // Obtener usuario completo de la base de datos
    const admin = await Usuario.findById(userPayload.userId);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Usuario no encontrado.",
        },
        { status: 404 }
      );
    }

    // Verificar que sea administrador
    if (admin.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Solo administradores pueden crear canchas",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      descripcion,
      tipo_cancha,
      ubicacion,
      precio_por_hora,
      capacidad_jugadores,
      horario_apertura,
      horario_cierre,
      imagenes,
      disponible = true,
    } = body;

    // Validaciones básicas
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El nombre debe tener al menos 2 caracteres",
        },
        { status: 400 }
      );
    }

    if (!descripcion || descripcion.trim().length < 10) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La descripción debe tener al menos 10 caracteres",
        },
        { status: 400 }
      );
    }

    if (!tipo_cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El tipo de cancha es requerido",
        },
        { status: 400 }
      );
    }

    if (!ubicacion || ubicacion.trim().length < 2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La ubicación es requerida",
        },
        { status: 400 }
      );
    }

    const precio = Number(precio_por_hora);
    if (isNaN(precio) || precio <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El precio debe ser un número mayor a 0",
        },
        { status: 400 }
      );
    }

    const capacidad = Number(capacidad_jugadores);
    if (isNaN(capacidad) || capacidad <= 0 || capacidad > 50) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La capacidad debe ser un número entre 1 y 50",
        },
        { status: 400 }
      );
    }

    if (!horario_apertura || !horario_cierre) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Los horarios de apertura y cierre son requeridos",
        },
        { status: 400 }
      );
    }

    if (horario_apertura >= horario_cierre) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El horario de cierre debe ser posterior al de apertura",
        },
        { status: 400 }
      );
    }

    // Verificar que no existe una cancha con el mismo nombre y ubicación
    const existingCancha = await Cancha.findOne({
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
    });

    if (existingCancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Ya existe una cancha con ese nombre en esa ubicación",
        },
        { status: 409 }
      );
    }

    // Crear nueva cancha
    const nuevaCancha = new Cancha({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipo_cancha,
      ubicacion: ubicacion.trim(),
      precio_por_hora: Number(precio_por_hora),
      capacidad_jugadores: Number(capacidad_jugadores),
      horario_apertura,
      horario_cierre,
      imagenes: imagenes || ["/api/placeholder/600/400"],
      disponible,
      propietario_id: admin._id,
    });

    const canchaGuardada = await nuevaCancha.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha creada exitosamente",
      data: { cancha: canchaGuardada },
    });
  } catch (error) {
    console.error("Error al crear cancha:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
        data: null,
      },
      { status: 500 }
    );
  }
}
