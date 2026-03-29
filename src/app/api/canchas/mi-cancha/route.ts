import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import { ApiResponse } from "@/types";
import { isValidObjectId, requireAuth } from "@/lib/auth";
import { sanitizeInterval, validatePricingRules } from "@/lib/pricing";

function buildCanchaFilter(userId: string, rol: string, canchaId?: string | null) {
  if (rol === "admin") {
    return canchaId && isValidObjectId(canchaId) ? { _id: canchaId } : {};
  }

  const filter: Record<string, unknown> = { propietario_id: userId };
  if (canchaId && isValidObjectId(canchaId)) {
    filter._id = canchaId;
  }

  return filter;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Token de autenticación requerido" },
        { status: 401 }
      );
    }

    if (auth.rol !== "propietario_cancha" && auth.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo propietarios o administradores pueden acceder.",
        },
        { status: 403 }
      );
    }

    const canchaId = new URL(request.url).searchParams.get("cancha_id");
    const canchas = await Cancha.find(
      buildCanchaFilter(auth.userId, auth.rol, null)
    )
      .sort({ createdAt: -1 })
      .lean();

    if (!canchas.length) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No tienes canchas asignadas." },
        { status: 404 }
      );
    }

    const cancha =
      (canchaId
        ? canchas.find((item) => (item as unknown as { _id: unknown })._id?.toString() === canchaId)
        : canchas[0]) || null;

    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Cancha no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Cancha obtenida exitosamente",
      data: {
        ...cancha,
        canchas: canchas.map((item) => ({
          _id: (item as unknown as { _id: unknown; nombre: string })._id?.toString(),
          nombre: (item as unknown as { _id: unknown; nombre: string }).nombre,
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo cancha del propietario:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    if (auth.rol !== "propietario_cancha" && auth.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autorizado." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      cancha_id,
      imagenes,
      precio_por_hora,
      precios_por_horario,
      horario_apertura,
      horario_cierre,
      dias_operativos,
      intervalo_reserva_minutos,
      aprobacion_automatica,
      descripcion,
      nombre,
    } = body;

    if (!cancha_id || !isValidObjectId(cancha_id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de cancha inválido." },
        { status: 400 }
      );
    }

    const cancha = await Cancha.findOne(
      buildCanchaFilter(auth.userId, auth.rol, cancha_id)
    );

    if (!cancha) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Cancha no encontrada." },
        { status: 404 }
      );
    }

    const normalizedInterval = sanitizeInterval(
      Number(intervalo_reserva_minutos || cancha.intervalo_reserva_minutos)
    );

    if (precio_por_hora !== undefined && Number(precio_por_hora) <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "El precio base debe ser mayor a 0." },
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
          message: "El horario de cierre debe ser posterior al de apertura.",
        },
        { status: 400 }
      );
    }

    const pricingRulesValidation = validatePricingRules(
      precios_por_horario || cancha.precios_por_horario || [],
      normalizedInterval
    );

    if (pricingRulesValidation) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: pricingRulesValidation },
        { status: 400 }
      );
    }

    cancha.intervalo_reserva_minutos = normalizedInterval;

    if (imagenes !== undefined) cancha.imagenes = imagenes;
    if (precio_por_hora !== undefined) cancha.precio_por_hora = Number(precio_por_hora);
    if (precios_por_horario !== undefined) cancha.precios_por_horario = precios_por_horario;
    if (horario_apertura) cancha.horario_apertura = horario_apertura;
    if (horario_cierre) cancha.horario_cierre = horario_cierre;
    if (dias_operativos !== undefined) cancha.dias_operativos = dias_operativos;
    if (aprobacion_automatica !== undefined) {
      cancha.aprobacion_automatica = Boolean(aprobacion_automatica);
    }
    if (descripcion !== undefined) cancha.descripcion = descripcion;
    if (nombre !== undefined) cancha.nombre = nombre;

    await cancha.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Configuración de cancha actualizada exitosamente.",
      data: { cancha },
    });
  } catch (error) {
    console.error("Error actualizando cancha del propietario:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
