import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import {
  applySearchFilters,
  SearchFilters,
  CanchaConDistancia,
  geocodeAddress,
} from "@/lib/geolocation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  AppError,
} from "@/lib/error-handler";

// Tipo para los datos crudos de MongoDB
interface CanchaRaw {
  _id: unknown;
  descripcion: string;
  tipo_cancha: string;
  ubicacion: string;
  precio_por_hora: number;
  capacidad_jugadores: number;
  horario_apertura: string;
  horario_cierre: string;
  disponible: boolean;
  coordenadas?: { latitude: number; longitude: number };
  calificacion_promedio?: number;
  total_reviews?: number;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Construir filtros desde query parameters
    const filters: SearchFilters = {
      ubicacion: searchParams.get("ubicacion") || undefined,
      radio: searchParams.get("radio")
        ? parseInt(searchParams.get("radio")!)
        : undefined,
      precio_min: searchParams.get("precio_min")
        ? parseInt(searchParams.get("precio_min")!)
        : undefined,
      precio_max: searchParams.get("precio_max")
        ? parseInt(searchParams.get("precio_max")!)
        : undefined,
      tipo_cancha: searchParams.get("tipo_cancha") || undefined,
      capacidad_min: searchParams.get("capacidad_min")
        ? parseInt(searchParams.get("capacidad_min")!)
        : undefined,
      capacidad_max: searchParams.get("capacidad_max")
        ? parseInt(searchParams.get("capacidad_max")!)
        : undefined,
      fecha: searchParams.get("fecha") || undefined,
      disponible_desde: searchParams.get("disponible_desde") || undefined,
      disponible_hasta: searchParams.get("disponible_hasta") || undefined,
      ordenar_por:
        (searchParams.get("ordenar_por") as SearchFilters["ordenar_por"]) ||
        undefined,
      direccion:
        (searchParams.get("direccion") as SearchFilters["direccion"]) || "asc",
    };

    // Obtener todas las canchas disponibles
    const canchasRaw = (await Cancha.find({
      disponible: true,
    }).lean()) as unknown as CanchaRaw[];

    // Convertir a formato CanchaConDistancia
    const canchas: CanchaConDistancia[] = canchasRaw.map(
      (cancha: CanchaRaw) => ({
        _id: cancha._id?.toString() || "",
        descripcion: cancha.descripcion,
        tipo_cancha: cancha.tipo_cancha,
        ubicacion: cancha.ubicacion,
        precio_por_hora: cancha.precio_por_hora,
        capacidad_jugadores: cancha.capacidad_jugadores,
        horario_apertura: cancha.horario_apertura,
        horario_cierre: cancha.horario_cierre,
        disponible: cancha.disponible,
        coordenadas: cancha.coordenadas,
        calificacion_promedio: cancha.calificacion_promedio,
        total_reviews: cancha.total_reviews,
      })
    );

    // Obtener coordenadas del usuario si proporciona ubicación
    let userLocation = undefined;
    if (filters.ubicacion) {
      // Intentar parsear como coordenadas directas
      const coordsMatch = filters.ubicacion.match(
        /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/
      );
      if (coordsMatch) {
        userLocation = {
          latitude: parseFloat(coordsMatch[1]),
          longitude: parseFloat(coordsMatch[2]),
        };
      } else {
        // Geocodificar la dirección
        try {
          userLocation = await geocodeAddress(filters.ubicacion);
        } catch (error) {
          console.warn("Error al geocodificar ubicación:", error);
        }
      }
    }

    // Aplicar filtros
    const resultados = applySearchFilters(
      canchas,
      filters,
      userLocation || undefined
    );

    // Preparar metadata de la búsqueda
    const metadata = {
      total_resultados: resultados.length,
      filtros_aplicados: filters,
      ubicacion_usuario: userLocation,
      tiempo_busqueda: Date.now(),
    };

    return NextResponse.json(
      createSuccessResponse({
        canchas: resultados,
        metadata,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en búsqueda de canchas:", error);
    const apiError =
      error instanceof AppError
        ? error
        : new AppError(
            "Error en búsqueda de canchas",
            500,
            true,
            "SEARCH_ERROR"
          );

    return NextResponse.json(createErrorResponse(apiError), {
      status: apiError.statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const filters: SearchFilters = body.filters || {};

    // Validar filtros
    if (
      filters.precio_min &&
      filters.precio_max &&
      filters.precio_min > filters.precio_max
    ) {
      throw new ValidationError(
        "El precio mínimo no puede ser mayor al precio máximo"
      );
    }

    if (
      filters.capacidad_min &&
      filters.capacidad_max &&
      filters.capacidad_min > filters.capacidad_max
    ) {
      throw new ValidationError(
        "La capacidad mínima no puede ser mayor a la capacidad máxima"
      );
    }

    // Obtener canchas
    const canchasRaw = (await Cancha.find({
      disponible: true,
    }).lean()) as unknown as CanchaRaw[];

    const canchas: CanchaConDistancia[] = canchasRaw.map(
      (cancha: CanchaRaw) => ({
        _id: cancha._id?.toString() || "",
        descripcion: cancha.descripcion,
        tipo_cancha: cancha.tipo_cancha,
        ubicacion: cancha.ubicacion,
        precio_por_hora: cancha.precio_por_hora,
        capacidad_jugadores: cancha.capacidad_jugadores,
        horario_apertura: cancha.horario_apertura,
        horario_cierre: cancha.horario_cierre,
        disponible: cancha.disponible,
        coordenadas: cancha.coordenadas,
        calificacion_promedio: cancha.calificacion_promedio,
        total_reviews: cancha.total_reviews,
      })
    );

    // Obtener ubicación del usuario
    let userLocation = undefined;
    if (body.user_location) {
      userLocation = body.user_location;
    } else if (filters.ubicacion) {
      // Intentar geocodificar
      try {
        userLocation = await geocodeAddress(filters.ubicacion);
      } catch (error) {
        console.warn("Error al geocodificar ubicación:", error);
      }
    }

    // Aplicar filtros
    const resultados = applySearchFilters(
      canchas,
      filters,
      userLocation || undefined
    );

    // Metadata extendida para POST
    const metadata = {
      total_resultados: resultados.length,
      total_disponibles: canchas.length,
      filtros_aplicados: filters,
      ubicacion_usuario: userLocation,
      tiempo_busqueda: Date.now(),
      estadisticas: {
        precio_promedio:
          resultados.length > 0
            ? Math.round(
                resultados.reduce((sum, c) => sum + c.precio_por_hora, 0) /
                  resultados.length
              )
            : 0,
        distancia_promedio:
          userLocation && resultados.length > 0
            ? Math.round(
                (resultados.reduce((sum, c) => sum + (c.distancia || 0), 0) /
                  resultados.length) *
                  100
              ) / 100
            : null,
        tipos_disponibles: [...new Set(resultados.map((c) => c.tipo_cancha))],
      },
    };

    return NextResponse.json(
      createSuccessResponse({
        canchas: resultados,
        metadata,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en búsqueda avanzada de canchas:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(createErrorResponse(error), { status: 400 });
    }

    const apiError =
      error instanceof AppError
        ? error
        : new AppError(
            "Error en búsqueda avanzada de canchas",
            500,
            true,
            "SEARCH_ERROR"
          );

    return NextResponse.json(createErrorResponse(apiError), {
      status: apiError.statusCode,
    });
  }
}
