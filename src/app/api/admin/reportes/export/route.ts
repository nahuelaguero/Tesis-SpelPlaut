import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { requireAuth } from "@/lib/auth";

function getStartDate(periodo: string) {
  const now = new Date();
  const start = new Date(now);

  switch (periodo) {
    case "1m":
      start.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 3);
      break;
  }

  return start;
}

function escapeCsv(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message: "Acceso denegado. Debes iniciar sesión",
        },
        { status: 401 }
      );
    }

    if (auth.rol !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Acceso denegado. Solo administradores pueden exportar reportes",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "3m";
    const startDate = getStartDate(periodo);

    const reservas = await Reserva.find({
      createdAt: { $gte: startDate },
      estado: { $in: ["confirmada", "completada"] },
    })
      .populate("cancha_id", "nombre ubicacion tipo_cancha")
      .populate("usuario_id", "nombre_completo email")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "reserva_id",
      "fecha_reserva",
      "hora_inicio",
      "hora_fin",
      "estado",
      "precio_total",
      "metodo_pago",
      "cancha_nombre",
      "cancha_ubicacion",
      "tipo_cancha",
      "usuario_nombre",
      "usuario_email",
      "creado_en",
    ];

    const lines = reservas.map((reserva) => {
      const cancha =
        reserva.cancha_id &&
        typeof reserva.cancha_id === "object" &&
        "nombre" in reserva.cancha_id
          ? (reserva.cancha_id as {
              nombre: string;
              ubicacion?: string;
              tipo_cancha?: string;
            })
          : null;
      const usuario =
        reserva.usuario_id &&
        typeof reserva.usuario_id === "object" &&
        "nombre_completo" in reserva.usuario_id
          ? (reserva.usuario_id as {
              nombre_completo: string;
              email?: string;
            })
          : null;

      return [
        reserva._id?.toString(),
        reserva.fecha,
        reserva.hora_inicio,
        reserva.hora_fin,
        reserva.estado,
        reserva.precio_total,
        reserva.metodo_pago || "",
        cancha?.nombre || "Cancha no disponible",
        cancha?.ubicacion || "",
        cancha?.tipo_cancha || "",
        usuario?.nombre_completo || "Usuario no disponible",
        usuario?.email || "",
        reserva.createdAt ? new Date(reserva.createdAt).toISOString() : "",
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csv = `\uFEFF${[headers.join(","), ...lines].join("\n")}`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"reporte-spelplaut-${periodo}.csv\"`,
      },
    });
  } catch (error) {
    console.error("Error exportando reporte:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
