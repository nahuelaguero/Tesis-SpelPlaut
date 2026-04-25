import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { requireAdmin, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { getMinimumPrice } from "@/lib/pricing";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canchaFromDB = await Cancha.findById(id).lean() as any;

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
    const cancha = {
      _id: canchaFromDB._id,
      nombre: canchaFromDB.nombre,
      tipo: tipoMap[canchaFromDB.tipo_cancha] || canchaFromDB.tipo_cancha,
      ubicacion: canchaFromDB.ubicacion,
      precio_por_hora: Number(canchaFromDB.precio_por_hora) || 0,
      precio_desde: getMinimumPrice({
        precio_por_hora: Number(canchaFromDB.precio_por_hora) || 0,
        precios_por_horario: canchaFromDB.precios_por_horario || [],
      }),
      precios_por_horario: canchaFromDB.precios_por_horario || [],
      capacidad_maxima: Number(canchaFromDB.capacidad_jugadores) || 0,
      disponible: canchaFromDB.disponible,
      descripcion: canchaFromDB.descripcion,
      servicios: getServiciosPorTipo(canchaFromDB.tipo_cancha),
      imagenes: canchaFromDB.imagenes || [],
      horario_apertura: canchaFromDB.horario_apertura,
      horario_cierre: canchaFromDB.horario_cierre,
      intervalo_reserva_minutos: canchaFromDB.intervalo_reserva_minutos || 60,
      aprobacion_automatica: canchaFromDB.aprobacion_automatica !== false,
      imagen_url: canchaFromDB.imagenes?.[0] || "/api/placeholder/600/400",
    };

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha obtenida exitosamente",
      data: { cancha },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
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
      descripcion,
      tipo_cancha,
      ubicacion,
      imagenes,
      precio_por_hora,
      capacidad_jugadores,
      horario_apertura,
      horario_cierre,
      dias_operativos,
      precios_por_horario,
      intervalo_reserva_minutos,
      aprobacion_automatica,
      disponible,
    } = body;

    // Validaciones básicas
    if (nombre !== undefined && nombre.trim() === "") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El nombre no puede estar vacío",
        },
        { status: 400 }
      );
    }

    if (precio_por_hora !== undefined && precio_por_hora <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El precio por hora debe ser mayor a 0",
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
      (ubicacion && ubicacion !== cancha.ubicacion)
    ) {
      const existingCancha = await Cancha.findOne({
        _id: { $ne: id },
        nombre: nombre || cancha.nombre,
        ubicacion: ubicacion || cancha.ubicacion,
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

    // Construir objeto de actualización solo con campos presentes
    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tipo_cancha !== undefined) updateData.tipo_cancha = tipo_cancha;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    if (imagenes !== undefined) updateData.imagenes = imagenes;
    if (precio_por_hora !== undefined) updateData.precio_por_hora = precio_por_hora;
    if (capacidad_jugadores !== undefined) updateData.capacidad_jugadores = capacidad_jugadores;
    if (horario_apertura !== undefined) updateData.horario_apertura = horario_apertura;
    if (horario_cierre !== undefined) updateData.horario_cierre = horario_cierre;
    if (dias_operativos !== undefined) updateData.dias_operativos = dias_operativos;
    if (precios_por_horario !== undefined) updateData.precios_por_horario = precios_por_horario;
    if (intervalo_reserva_minutos !== undefined) updateData.intervalo_reserva_minutos = intervalo_reserva_minutos;
    if (aprobacion_automatica !== undefined) updateData.aprobacion_automatica = aprobacion_automatica;
    if (disponible !== undefined) updateData.disponible = disponible;

    // Actualizar cancha
    const updatedCancha = await Cancha.findByIdAndUpdate(
      id,
      updateData,
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

    // En lugar de eliminar completamente, marcar como no disponible
    const updatedCancha = await Cancha.findByIdAndUpdate(
      id,
      { disponible: false },
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
