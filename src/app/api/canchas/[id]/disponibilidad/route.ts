import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { ApiResponse } from "@/types";
import { verify } from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validar formato de ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de cancha inválido",
        },
        { status: 400 }
      );
    }

    // Buscar cancha con disponibilidad
    const cancha = await Cancha.findById(id).select(
      "disponibilidad nombre propietario_id"
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
      message: "Disponibilidad obtenida exitosamente",
      data: {
        canchaId: cancha._id,
        nombre: cancha.nombre,
        disponibilidad: cancha.disponibilidad || [],
      },
    });
  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
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

    const { id } = await params;

    // Validar formato de ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de cancha inválido",
        },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token de autenticación requerido",
        },
        { status: 401 }
      );
    }

    let userId: string;
    let userRole: string;
    try {
      const decoded = verify(token, process.env.JWT_SECRET || "secret") as {
        userId: string;
        rol: string;
      };
      userId = decoded.userId;
      userRole = decoded.rol;
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido",
        },
        { status: 401 }
      );
    }

    // Buscar cancha
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

    // Verificar permisos (solo propietario o admin)
    if (userRole !== "admin" && cancha.propietario_id.toString() !== userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No tienes permisos para modificar esta cancha",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fecha, disponible, motivo } = body;

    // Validaciones
    if (!fecha || typeof disponible !== "boolean") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Fecha y disponibilidad son requeridos",
        },
        { status: 400 }
      );
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Formato de fecha inválido (YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    // Validar que la fecha no sea del pasado
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaObj < hoy) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se puede modificar la disponibilidad de fechas pasadas",
        },
        { status: 400 }
      );
    }

    // Actualizar disponibilidad
    interface DisponibilidadItem {
      fecha: string;
      disponible: boolean;
      motivo?: string;
    }

    const disponibilidadActual: DisponibilidadItem[] =
      cancha.disponibilidad || [];
    const indiceExistente = disponibilidadActual.findIndex(
      (d: DisponibilidadItem) => d.fecha === fecha
    );

    const nuevaEntrada: DisponibilidadItem = {
      fecha,
      disponible,
      motivo: disponible ? undefined : motivo,
    };

    if (indiceExistente >= 0) {
      // Actualizar entrada existente
      disponibilidadActual[indiceExistente] = nuevaEntrada;
    } else {
      // Agregar nueva entrada
      disponibilidadActual.push(nuevaEntrada);
    }

    // Ordenar por fecha
    disponibilidadActual.sort((a: DisponibilidadItem, b: DisponibilidadItem) =>
      a.fecha.localeCompare(b.fecha)
    );

    // Guardar cambios
    await Cancha.findByIdAndUpdate(id, {
      disponibilidad: disponibilidadActual,
    });

    console.log(
      `📅 Disponibilidad actualizada para cancha ${cancha.nombre} - ${fecha}: ${
        disponible ? "Disponible" : "No disponible"
      }`
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Disponibilidad actualizada exitosamente",
      data: {
        fecha,
        disponible,
        motivo,
      },
    });
  } catch (error) {
    console.error("Error actualizando disponibilidad:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
