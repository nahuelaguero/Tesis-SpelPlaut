import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { ApiResponse } from "@/types";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";

type RawRecord = Record<string, unknown>;

function getObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  if (value && typeof value === "object" && "_id" in value) {
    return getObjectId((value as { _id: unknown })._id);
  }
  return null;
}

function objectKey(value: unknown): string | null {
  return getObjectId(value)?.toString() || null;
}

function safeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function safeDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function publicUser(user: RawRecord | undefined) {
  if (!user) return null;
  return {
    _id: objectKey(user._id) || String(user._id || ""),
    nombre_completo: safeString(user.nombre_completo),
    email: safeString(user.email),
    telefono: safeString(user.telefono),
  };
}

function publicCancha(cancha: RawRecord | undefined) {
  if (!cancha) return null;
  return {
    _id: objectKey(cancha._id) || String(cancha._id || ""),
    nombre: safeString(cancha.nombre),
    ubicacion: safeString(cancha.ubicacion),
  };
}

export async function GET(request: NextRequest) {
  try {
    const connection = await connectDB();

    // Verificar autenticación y permisos de admin
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

    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET || "secret") as {
        userId: string;
        rol: string;
      };
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Token inválido",
        },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    if (decoded.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo los administradores pueden acceder",
        },
        { status: 403 }
      );
    }

    const db = connection.connection.db;
    if (!db) {
      throw new Error("Base de datos no inicializada");
    }

    // Leer nativo evita que reservas legacy con refs inválidas rompan populate().
    const rawReservas = (await db
      .collection("reservas")
      .find({})
      .sort({ fecha_reserva: -1, createdAt: -1 })
      .toArray()) as RawRecord[];

    const usuarioIds = [
      ...new Set(
        rawReservas.map((reserva) => objectKey(reserva.usuario_id)).filter(Boolean)
      ),
    ].map((id) => new ObjectId(id as string));

    const canchaIds = [
      ...new Set(
        rawReservas.map((reserva) => objectKey(reserva.cancha_id)).filter(Boolean)
      ),
    ].map((id) => new ObjectId(id as string));

    const [usuarios, canchas] = await Promise.all([
      usuarioIds.length
        ? db
            .collection("users")
            .find({ _id: { $in: usuarioIds } })
            .project({ nombre_completo: 1, email: 1, telefono: 1 })
            .toArray()
        : [],
      canchaIds.length
        ? db
            .collection("canchas")
            .find({ _id: { $in: canchaIds } })
            .project({ nombre: 1, ubicacion: 1 })
            .toArray()
        : [],
    ]);

    const usuariosById = new Map(
      (usuarios as RawRecord[]).map((usuario) => [objectKey(usuario._id), usuario])
    );
    const canchasById = new Map(
      (canchas as RawRecord[]).map((cancha) => [objectKey(cancha._id), cancha])
    );

    const reservas = rawReservas.map((reserva) => {
      const usuarioId = objectKey(reserva.usuario_id);
      const canchaId = objectKey(reserva.cancha_id);

      return {
        _id: objectKey(reserva._id) || String(reserva._id || ""),
        usuario_id: usuarioId ? publicUser(usuariosById.get(usuarioId)) : null,
        cancha_id: canchaId ? publicCancha(canchasById.get(canchaId)) : null,
        fecha: safeString(reserva.fecha),
        hora_inicio: safeString(reserva.hora_inicio),
        hora_fin: safeString(reserva.hora_fin),
        precio_total: safeNumber(reserva.precio_total),
        estado: safeString(reserva.estado),
        fecha_reserva: safeDate(reserva.fecha_reserva),
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reservas obtenidas exitosamente",
      data: { reservas },
    });
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
