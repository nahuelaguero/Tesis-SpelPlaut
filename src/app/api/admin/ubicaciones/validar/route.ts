import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiResponse } from "@/types";

interface UbicacionValidada {
  original: string;
  normalizada: string;
  tipo: "direccion" | "coordenadas" | "lugar";
  coordenadas?: {
    lat: number;
    lng: number;
  };
  componentes?: {
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
  };
  valida: boolean;
  sugerencias?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que sea administrador
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Acceso denegado. Solo administradores pueden validar ubicaciones",
        },
        { status: 403 }
      );
    }

    const { ubicacion } = await request.json();

    if (!ubicacion || typeof ubicacion !== "string") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Ubicación es requerida",
        },
        { status: 400 }
      );
    }

    const ubicacionLimpia = ubicacion.trim();

    // Validar y clasificar la ubicación
    const resultado = validarUbicacion(ubicacionLimpia);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Ubicación validada",
      data: { ubicacion: resultado },
    });
  } catch (error) {
    console.error("Error al validar ubicación:", error);
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

function validarUbicacion(ubicacion: string): UbicacionValidada {
  // Detectar coordenadas GPS
  const coordenadasRegex = /(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/;
  const coordenadasMatch = ubicacion.match(coordenadasRegex);

  if (coordenadasMatch) {
    const lat = parseFloat(coordenadasMatch[1]);
    const lng = parseFloat(coordenadasMatch[2]);

    // Validar que estén en rangos válidos para Paraguay
    const enParaguay =
      lat >= -27.5 &&
      lat <= -19.5 && // Latitud Paraguay
      lng >= -62.5 &&
      lng <= -54.0; // Longitud Paraguay

    return {
      original: ubicacion,
      normalizada: `${lat}, ${lng}`,
      tipo: "coordenadas",
      coordenadas: { lat, lng },
      valida: enParaguay,
      sugerencias: enParaguay
        ? []
        : [
            "Las coordenadas están fuera del territorio paraguayo",
            "Verifica que las coordenadas sean correctas para Paraguay",
          ],
    };
  }

  // Detectar direcciones estructuradas
  const contieneNumero = /\d+/.test(ubicacion);
  const palabrasClave = [
    "av",
    "avenida",
    "calle",
    "ruta",
    "km",
    "barrio",
    "ciudad",
  ];
  const tieneEstructura = palabrasClave.some((palabra) =>
    ubicacion.toLowerCase().includes(palabra)
  );

  // Detectar departamentos de Paraguay
  const departamentos = [
    "asunción",
    "concepción",
    "san pedro",
    "cordillera",
    "guairá",
    "caaguazú",
    "caazapá",
    "itapúa",
    "misiones",
    "paraguarí",
    "alto paraná",
    "central",
    "ñeembucú",
    "amambay",
    "canindeyú",
    "presidente hayes",
    "boquerón",
    "alto paraguay",
  ];

  const tieneDepartamento = departamentos.some((dep) =>
    ubicacion.toLowerCase().includes(dep)
  );

  let tipo: "direccion" | "lugar" = "lugar";
  let valida = true;
  const sugerencias: string[] = [];

  if (contieneNumero && tieneEstructura) {
    tipo = "direccion";
  }

  // Validaciones y sugerencias
  if (ubicacion.length < 10) {
    valida = false;
    sugerencias.push("La ubicación es muy corta. Agrega más detalles.");
  }

  if (!tieneDepartamento) {
    sugerencias.push(
      "Considera agregar el departamento (ej: Asunción, Central, Alto Paraná)"
    );
  }

  if (!ubicacion.toLowerCase().includes("paraguay")) {
    sugerencias.push(
      "Considera agregar 'Paraguay' al final para mayor claridad"
    );
  }

  // Extraer componentes básicos
  const partes = ubicacion.split(",").map((p) => p.trim());
  const componentes: Record<string, string> = {};

  if (partes.length >= 2) {
    componentes.direccion = partes[0];
    componentes.ciudad = partes[1];
    if (partes.length >= 3) {
      componentes.departamento = partes[2];
    }
    if (partes.length >= 4) {
      componentes.pais = partes[3];
    }
  }

  return {
    original: ubicacion,
    normalizada: ubicacion,
    tipo,
    componentes: Object.keys(componentes).length > 0 ? componentes : undefined,
    valida,
    sugerencias,
  };
}
