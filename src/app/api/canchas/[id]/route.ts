import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { requireAdmin, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";

// Función para obtener servicios por tipo de cancha
function getServiciosPorTipo(tipo: string): string[] {
  const serviciosMap: Record<string, string[]> = {
    Football11: [
      "Arcos reglamentarios",
      "Vestuarios",
      "Duchas",
      "Iluminación LED",
    ],
    Football5: ["Arcos", "Vestuarios", "Iluminación", "Césped sintético"],
    Tennis: ["Red reglamentaria", "Vestuarios", "Iluminación nocturna"],
    Basketball: [
      "Aros reglamentarios",
      "Vestuarios",
      "Piso de parquet",
      "Marcador",
    ],
    Padel: [
      "Paredes de cristal",
      "Vestuarios",
      "Iluminación LED",
      "Raquetas disponibles",
    ],
    Volleyball: [
      "Red reglamentaria",
      "Vestuarios",
      "Arena importada",
      "Marcador",
    ],
  };

  return serviciosMap[tipo] || ["Vestuarios", "Iluminación"];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

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

    const canchaFromDB = await Cancha.findById(id);

    if (!canchaFromDB) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // Mapeo de tipos de cancha de inglés a español
    const tipoMap: Record<string, string> = {
      Football11: "Fútbol 11",
      Football5: "Fútbol 5",
      Tennis: "Tenis",
      Basketball: "Básquet",
      Padel: "Pádel",
      Volleyball: "Vóley",
    };

    // Mapear los campos de la base de datos al formato esperado por el frontend
    const canchaObj = canchaFromDB.toObject
      ? canchaFromDB.toObject()
      : canchaFromDB;
    const cancha = {
      _id: canchaObj._id,
      nombre: canchaObj.nombre,
      tipo: tipoMap[canchaObj.tipo_cancha] || canchaObj.tipo_cancha, // Mapear tipo_cancha inglés -> español
      ubicacion: canchaObj.ubicacion,
      precio_por_hora: Number(canchaObj.precio_por_hora) || 0, // Asegurar que sea número
      capacidad_maxima: Number(canchaObj.capacidad_jugadores) || 0, // Asegurar que sea número
      disponible: canchaObj.disponible, // Campo disponible directo del modelo
      descripcion: canchaObj.descripcion,
      servicios: getServiciosPorTipo(canchaObj.tipo_cancha), // Servicios basados en tipo de cancha
      horario_apertura: canchaObj.horario_apertura,
      horario_cierre: canchaObj.horario_cierre,
      imagen_url: canchaObj.imagenes?.[0] || "/api/placeholder/600/400",
      valoracion: 4.5, // Valor por defecto, TODO: implementar sistema de valoraciones
    };

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
            "Acceso denegado. Solo administradores pueden actualizar canchas",
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
      tipo,
      ubicacion,
      imagenes,
      precio_hora,
      horarios_disponibles,
      estado,
    } = body;

    // Validaciones básicas
    if (nombre && nombre.trim() === "") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El nombre no puede estar vacío",
        },
        { status: 400 }
      );
    }

    if (precio_hora && precio_hora <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El precio por hora debe ser mayor a 0",
        },
        { status: 400 }
      );
    }

    if (ubicacion && (!ubicacion.direccion || !ubicacion.ciudad)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La ubicación debe incluir dirección y ciudad",
        },
        { status: 400 }
      );
    }

    // Verificar que la cancha existe
    const cancha = await Cancha.findById(id);
    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre o ubicación, verificar que no existe otra con esos datos
    if (
      (nombre && nombre !== cancha.nombre) ||
      (ubicacion &&
        (ubicacion.direccion !== cancha.ubicacion.direccion ||
          ubicacion.ciudad !== cancha.ubicacion.ciudad))
    ) {
      const existingCancha = await Cancha.findOne({
        _id: { $ne: id },
        nombre: nombre || cancha.nombre,
        "ubicacion.direccion":
          ubicacion?.direccion || cancha.ubicacion.direccion,
        "ubicacion.ciudad": ubicacion?.ciudad || cancha.ubicacion.ciudad,
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

    // Actualizar cancha
    const updatedCancha = await Cancha.findByIdAndUpdate(
      id,
      {
        ...(nombre && { nombre }),
        ...(tipo && { tipo }),
        ...(ubicacion && { ubicacion }),
        ...(imagenes && { imagenes }),
        ...(precio_hora && { precio_hora }),
        ...(horarios_disponibles && { horarios_disponibles }),
        ...(estado && { estado }),
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha actualizada exitosamente",
      data: { cancha: updatedCancha },
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
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
            "Acceso denegado. Solo administradores pueden eliminar canchas",
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

    // Verificar que la cancha existe
    const cancha = await Cancha.findById(id);
    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Cancha no encontrada",
        },
        { status: 404 }
      );
    }

    // En lugar de eliminar completamente, cambiar estado a 'inactivo'
    const updatedCancha = await Cancha.findByIdAndUpdate(
      id,
      { estado: "inactivo" },
      { new: true }
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha desactivada exitosamente",
      data: { cancha: updatedCancha },
    });
  } catch (error) {
    console.error("Error al eliminar cancha:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
