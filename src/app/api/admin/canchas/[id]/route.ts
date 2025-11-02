import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { requireAdmin, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

// Obtener una cancha específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verificar que sea administrador
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Solo administradores pueden ver canchas",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de cancha inválido",
        },
        { status: 400 }
      );
    }

    const cancha = await Cancha.findById(id).populate(
      "propietario_id",
      "nombre_completo email"
    );

    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha obtenida exitosamente",
      data: { cancha },
    });
  } catch (error) {
    console.error("Error al obtener cancha:", error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verificar que sea administrador
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Acceso denegado. Solo administradores pueden editar canchas",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de cancha inválido",
        },
        { status: 400 }
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
      disponible,
      imagenes,
    } = body;

    // Validaciones básicas
    if (nombre && nombre.trim().length < 2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El nombre debe tener al menos 2 caracteres",
        },
        { status: 400 }
      );
    }

    if (descripcion && descripcion.trim().length < 10) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La descripción debe tener al menos 10 caracteres",
        },
        { status: 400 }
      );
    }

    if (ubicacion && ubicacion.trim().length < 2) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La ubicación debe tener al menos 2 caracteres",
        },
        { status: 400 }
      );
    }

    if (
      precio_por_hora &&
      (isNaN(Number(precio_por_hora)) || Number(precio_por_hora) <= 0)
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El precio debe ser un número mayor a 0",
        },
        { status: 400 }
      );
    }

    if (
      capacidad_jugadores &&
      (isNaN(Number(capacidad_jugadores)) ||
        Number(capacidad_jugadores) <= 0 ||
        Number(capacidad_jugadores) > 50)
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La capacidad debe ser un número entre 1 y 50",
        },
        { status: 400 }
      );
    }

    if (
      horario_apertura &&
      horario_cierre &&
      horario_apertura >= horario_cierre
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El horario de cierre debe ser posterior al de apertura",
        },
        { status: 400 }
      );
    }

    // Verificar que la cancha existe
    const canchaExistente = await Cancha.findById(id);
    if (!canchaExistente) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre o ubicación, verificar que no existe otra con esos datos
    if (nombre || ubicacion) {
      const existingCancha = await Cancha.findOne({
        _id: { $ne: id },
        nombre: nombre || canchaExistente.nombre,
        ubicacion: ubicacion || canchaExistente.ubicacion,
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
    }

    // Construir el objeto de actualización
    const updateData: Partial<typeof body> = {};

    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (descripcion !== undefined) updateData.descripcion = descripcion.trim();
    if (tipo_cancha !== undefined) updateData.tipo_cancha = tipo_cancha;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion.trim();
    if (precio_por_hora !== undefined)
      updateData.precio_por_hora = Number(precio_por_hora);
    if (capacidad_jugadores !== undefined)
      updateData.capacidad_jugadores = Number(capacidad_jugadores);
    if (horario_apertura !== undefined)
      updateData.horario_apertura = horario_apertura;
    if (horario_cierre !== undefined)
      updateData.horario_cierre = horario_cierre;
    if (disponible !== undefined) updateData.disponible = disponible;
    if (imagenes !== undefined) updateData.imagenes = imagenes;

    // Actualizar la cancha
    const canchaActualizada = await Cancha.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha actualizada exitosamente",
      data: { cancha: canchaActualizada },
    });
  } catch (error) {
    console.error("Error al actualizar cancha:", error);

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
        data: null,
      },
      { status: 500 }
    );
  }
}
