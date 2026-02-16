import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { requireAdmin } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET() {
  try {
    await connectDB();

    const canchasFromDB = await Cancha.find({ disponible: true })
      .select('nombre descripcion tipo_cancha ubicacion precio_por_hora capacidad_jugadores disponible horario_apertura horario_cierre imagenes')
      .sort({ createdAt: -1 })
      .lean();

    // Mapeo de deportes de inglés a español
    const deporteMap: Record<string, string> = {
      Football11: "Fútbol 11",
      Football5: "Fútbol 5",
      Tennis: "Tenis",
      Basketball: "Básquet",
      Padel: "Pádel",
      Volleyball: "Vóley",
    };

    // Mapear los campos de la base de datos al formato esperado por el frontend
    const canchas = canchasFromDB.map((cancha) => {
      return {
        _id: cancha._id,
        nombre: cancha.nombre,
        tipo: deporteMap[cancha.tipo_cancha] || cancha.tipo_cancha,
        ubicacion: cancha.ubicacion,
        precio_por_hora: Number(cancha.precio_por_hora) || 0,
        capacidad_maxima: Number(cancha.capacidad_jugadores) || 0,
        disponible: cancha.disponible,
        descripcion: cancha.descripcion,
        servicios: cancha.imagenes || [],
        horario_apertura: cancha.horario_apertura,
        horario_cierre: cancha.horario_cierre,
        imagen_url: cancha.imagenes?.[0] || "/api/placeholder/600/400",
        valoracion: 4.5, // Valor por defecto, TODO: implementar sistema de valoraciones
      };
    });

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: "Canchas obtenidas exitosamente",
      data: {
        canchas,
        total: canchas.length,
      },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error("Error al obtener canchas:", error);
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

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verificar que sea administrador
    const admin = requireAdmin(request);
    if (!admin) {
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
      tipo,
      ubicacion,
      imagenes,
      precio_hora,
      horarios_disponibles,
      estado = "activo",
    } = body;

    // Validaciones básicas
    if (
      !nombre ||
      !tipo ||
      !ubicacion ||
      !precio_hora ||
      !horarios_disponibles
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Todos los campos obligatorios deben ser completados",
        },
        { status: 400 }
      );
    }

    if (!ubicacion.direccion || !ubicacion.ciudad) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La ubicación debe incluir dirección y ciudad",
        },
        { status: 400 }
      );
    }

    if (precio_hora <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El precio por hora debe ser mayor a 0",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(horarios_disponibles) ||
      horarios_disponibles.length === 0
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Debe especificar al menos un horario disponible",
        },
        { status: 400 }
      );
    }

    // Verificar que no exista una cancha con el mismo nombre en la misma ubicación
    const existingCancha = await Cancha.findOne({
      nombre,
      "ubicacion.direccion": ubicacion.direccion,
      "ubicacion.ciudad": ubicacion.ciudad,
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
    const newCancha = new Cancha({
      nombre,
      tipo,
      ubicacion,
      imagenes: imagenes || [],
      precio_hora,
      horarios_disponibles,
      estado,
    });

    await newCancha.save();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Cancha creada exitosamente",
        data: { cancha: newCancha },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear cancha:", error);

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
