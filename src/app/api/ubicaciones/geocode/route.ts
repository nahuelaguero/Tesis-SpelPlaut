import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { geocodeAddress, reverseGeocode } from "@/lib/geolocation-utils";
import { ApiResponse } from "@/types";

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No autenticado.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const latitude = Number(searchParams.get("lat"));
    const longitude = Number(searchParams.get("lng"));

    if (query) {
      const coordinates = await geocodeAddress(query);

      if (!coordinates) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "No se encontró una ubicación válida para esa búsqueda.",
          },
          { status: 404 }
        );
      }

      const reverse = await reverseGeocode(coordinates);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Ubicación geocodificada exitosamente.",
        data: {
          location: {
            address: reverse.address || query,
            coordinates,
            city: reverse.city,
            country: reverse.country,
          },
        },
      });
    }

    if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Debes enviar una búsqueda o coordenadas válidas.",
        },
        { status: 400 }
      );
    }

    const coordinates = { latitude, longitude };
    const reverse = await reverseGeocode(coordinates);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Ubicación obtenida exitosamente.",
      data: {
        location: {
          address:
            reverse.address ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates,
          city: reverse.city,
          country: reverse.country,
        },
      },
    });
  } catch (error) {
    console.error("Error geocodificando ubicación:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
