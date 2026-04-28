import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { ApiResponse } from "@/types";
import { isValidObjectId, requireAdmin } from "@/lib/auth";

const SAFE_USER_SELECT =
  "-contrasena_hash -codigo_2fa_email -codigo_2fa_expira -reset_password_token -reset_password_expires -push_subscriptions";
const VALID_ROLES = ["usuario", "propietario_cancha", "admin"] as const;

type UserAdminState = {
  _id: unknown;
  rol?: string;
  bloqueado?: boolean;
};

async function requireActiveAdmin(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return null;

  const adminUser = (await Usuario.findById(admin.userId)
    .select("_id rol bloqueado")
    .lean()) as UserAdminState | null;

  if (!adminUser || adminUser.rol !== "admin" || adminUser.bloqueado) {
    return null;
  }

  return admin;
}

async function hasAnotherAdmin(userId: string) {
  const count = await Usuario.countDocuments({
    _id: { $ne: userId },
    rol: "admin",
  });
  return count > 0;
}

async function hasAnotherActiveAdmin(userId: string) {
  const count = await Usuario.countDocuments({
    _id: { $ne: userId },
    rol: "admin",
    bloqueado: { $ne: true },
  });
  return count > 0;
}

async function wouldBreakAdminGuarantee(target: UserAdminState, userId: string) {
  if (target.rol !== "admin") return false;
  if (!(await hasAnotherAdmin(userId))) return true;
  if (!target.bloqueado && !(await hasAnotherActiveAdmin(userId))) return true;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireActiveAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo los administradores activos pueden acceder",
        },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios
    const usuarios = await Usuario.find({})
      .select(SAFE_USER_SELECT)
      .sort({ fecha_registro: -1 });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuarios obtenidos exitosamente",
      data: { usuarios },
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireActiveAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Solo los administradores activos pueden crear usuarios.",
        },
        { status: 403 }
      );
    }

    const { nombre_completo, email, telefono, password, rol } =
      await request.json();

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName =
      typeof nombre_completo === "string" ? nombre_completo.trim() : "";
    const normalizedPhone = typeof telefono === "string" ? telefono.trim() : "";
    const normalizedPassword = typeof password === "string" ? password : "";

    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !normalizedPassword
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Todos los campos son requeridos." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Formato de email inválido." },
        { status: 400 }
      );
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    const finalRole = VALID_ROLES.includes(rol) ? rol : "usuario";

    const existingUser = await Usuario.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "El email ya está registrado." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 12);
    const newUser = await Usuario.create({
      nombre_completo: normalizedName,
      email: normalizedEmail,
      telefono: normalizedPhone,
      rol: finalRole,
      contrasena_hash: hashedPassword,
      autenticacion_2FA: false,
      preferencias: {
        tema: "claro",
        notificaciones: true,
      },
      fecha_registro: new Date(),
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Usuario creado exitosamente.",
        data: {
          usuario: {
            _id: newUser._id,
            nombre_completo: newUser.nombre_completo,
            email: newUser.email,
            telefono: newUser.telefono,
            rol: newUser.rol,
            fecha_registro: newUser.fecha_registro,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando usuario:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "El email ya está registrado." },
        { status: 409 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireActiveAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Solo administradores activos." },
        { status: 403 }
      );
    }

    const { usuario_id, rol } = await request.json();

    if (!usuario_id || !isValidObjectId(usuario_id)) {
      return NextResponse.json<ApiResponse>({ success: false, message: "ID de usuario inválido." }, { status: 400 });
    }

    if (!rol || !VALID_ROLES.includes(rol)) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Rol inválido." }, { status: 400 });
    }

    const target = (await Usuario.findById(usuario_id)
      .select("_id rol bloqueado")
      .lean()) as UserAdminState | null;
    if (!target) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    if (usuario_id === admin.userId && rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No puedes quitarte tu propio rol admin." },
        { status: 400 }
      );
    }

    if (target.rol === "admin" && rol !== "admin" && (await wouldBreakAdminGuarantee(target, usuario_id))) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Debe quedar al menos un administrador activo." },
        { status: 400 }
      );
    }

    const updated = await Usuario.findByIdAndUpdate(
      usuario_id,
      { rol },
      { new: true }
    ).select(SAFE_USER_SELECT);

    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Rol actualizado exitosamente.",
      data: { usuario: updated },
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json<ApiResponse>({ success: false, message: "Error interno del servidor." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireActiveAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Solo administradores activos." },
        { status: 403 }
      );
    }

    const { usuario_id, nombre_completo, email, telefono, bloqueado, motivo_bloqueo } = await request.json();

    if (!usuario_id || !isValidObjectId(usuario_id)) {
      return NextResponse.json<ApiResponse>({ success: false, message: "ID de usuario inválido." }, { status: 400 });
    }

    const target = (await Usuario.findById(usuario_id)
      .select("_id rol bloqueado")
      .lean()) as UserAdminState | null;
    if (!target) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (nombre_completo?.trim()) updateData.nombre_completo = nombre_completo.trim();
    if (email?.trim()) updateData.email = email.trim().toLowerCase();
    if (telefono?.trim()) updateData.telefono = telefono.trim();
    if (typeof bloqueado === "boolean") {
      if (usuario_id === admin.userId && bloqueado) {
        return NextResponse.json<ApiResponse>(
          { success: false, message: "No puedes bloquear tu propio usuario." },
          { status: 400 }
        );
      }

      if (bloqueado && target.rol === "admin" && !(await hasAnotherActiveAdmin(usuario_id))) {
        return NextResponse.json<ApiResponse>(
          { success: false, message: "Debe quedar al menos un administrador activo." },
          { status: 400 }
        );
      }

      updateData.bloqueado = bloqueado;
      updateData.fecha_bloqueo = bloqueado ? new Date() : null;
      updateData.motivo_bloqueo = bloqueado
        ? typeof motivo_bloqueo === "string" && motivo_bloqueo.trim()
          ? motivo_bloqueo.trim()
          : "Bloqueado por administrador"
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, message: "No hay datos para actualizar." }, { status: 400 });
    }

    const updated = await Usuario.findByIdAndUpdate(
      usuario_id,
      updateData,
      { new: true }
    ).select(SAFE_USER_SELECT);

    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, message: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuario actualizado exitosamente.",
      data: { usuario: updated },
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json<ApiResponse>({ success: false, message: "Error interno del servidor." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const admin = await requireActiveAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Solo administradores activos." },
        { status: 403 }
      );
    }

    const usuarioId = request.nextUrl.searchParams.get("usuario_id");
    if (!usuarioId || !isValidObjectId(usuarioId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "ID de usuario inválido." },
        { status: 400 }
      );
    }

    if (usuarioId === admin.userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No puedes eliminar tu propio usuario." },
        { status: 400 }
      );
    }

    const target = (await Usuario.findById(usuarioId)
      .select("_id rol bloqueado")
      .lean()) as UserAdminState | null;
    if (!target) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    if (await wouldBreakAdminGuarantee(target, usuarioId)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Debe quedar al menos un administrador activo." },
        { status: 400 }
      );
    }

    await Usuario.findByIdAndDelete(usuarioId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuario eliminado exitosamente.",
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
