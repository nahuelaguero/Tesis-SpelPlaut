import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";
import Usuario from "@/models/Usuario";
import { generate2FACode } from "@/lib/utils";
import { send2FAEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  await connectDB();

  // Verificar autenticación
  const userPayload = requireAuth(request);
  if (!userPayload) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "No autenticado.",
      },
      { status: 401 }
    );
  }

  // Obtener usuario completo de la base de datos
  const user = await Usuario.findById(userPayload.userId);
  if (!user) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Usuario no encontrado.",
      },
      { status: 404 }
    );
  }
  // No exponer hash ni códigos 2FA
  const userObj =
    typeof (user as unknown as { toJSON?: () => unknown }).toJSON === "function"
      ? (user as unknown as { toJSON: () => unknown }).toJSON()
      : { ...user };
  const safeUser = userObj as Record<string, unknown>;
  delete safeUser.contrasena_hash;
  delete safeUser.codigo_2fa_email;
  delete safeUser.codigo_2fa_expira;
  return NextResponse.json<ApiResponse>({
    success: true,
    message: "Perfil de usuario",
    data: safeUser,
  });
}

export async function PATCH(request: NextRequest) {
  await connectDB();

  // Para cambios de configuración de 2FA, solo requerimos autenticación básica
  const userPayload = requireAuth(request);
  if (!userPayload) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "No autenticado.",
      },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { activar_2fa, codigo_verificacion } = body;

  // Si se está intentando activar 2FA
  if (activar_2fa === true) {
    try {
      const user = await Usuario.findById(userPayload.userId);
      if (!user) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Usuario no encontrado.",
          },
          { status: 404 }
        );
      }

      // Si no se proporciona código de verificación, enviar código por email
      if (!codigo_verificacion) {
        const codigo = generate2FACode();
        const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        user.codigo_2fa_email = codigo;
        user.codigo_2fa_expira = expiracion;
        await user.save();

        // Enviar código por email
        console.log(`\n🔐 CÓDIGO 2FA GENERADO PARA ${user.email}: ${codigo}`);
        console.log(
          `⏰ Expira en 10 minutos (${expiracion.toLocaleString()})\n`
        );
        await send2FAEmail(user.email, user.nombre_completo, codigo);

        return NextResponse.json<ApiResponse>({
          success: true,
          message:
            "Código de verificación enviado a tu correo electrónico. Ingrésalo para activar 2FA.",
          data: {
            requiere_verificacion: true,
            email_enviado: true,
          },
        });
      }

      // Si se proporciona código de verificación, validarlo
      if (codigo_verificacion) {
        if (!user.codigo_2fa_email || !user.codigo_2fa_expira) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message:
                "No hay código de verificación pendiente. Solicita uno nuevo.",
            },
            { status: 400 }
          );
        }

        if (new Date() > user.codigo_2fa_expira) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message:
                "El código de verificación ha expirado. Solicita uno nuevo.",
            },
            { status: 400 }
          );
        }

        if (user.codigo_2fa_email !== codigo_verificacion) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "Código de verificación incorrecto.",
            },
            { status: 400 }
          );
        }

        // Código válido, activar 2FA
        user.autenticacion_2FA = true;
        user.codigo_2fa_email = undefined;
        user.codigo_2fa_expira = undefined;
        await user.save();

        return NextResponse.json<ApiResponse>({
          success: true,
          message: "Verificación en dos pasos (2FA) activada exitosamente.",
          data: {
            autenticacion_2FA: true,
            verificacion_completada: true,
          },
        });
      }
    } catch (error) {
      console.error("Error al activar 2FA:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Error interno del servidor.",
        },
        { status: 500 }
      );
    }
  }

  // Si se está desactivando 2FA
  if (activar_2fa === false) {
    try {
      const user = await Usuario.findById(userPayload.userId);
      if (!user) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Usuario no encontrado.",
          },
          { status: 404 }
        );
      }

      user.autenticacion_2FA = false;
      user.codigo_2fa_email = undefined;
      user.codigo_2fa_expira = undefined;
      await user.save();

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Verificación en dos pasos (2FA) desactivada exitosamente.",
        data: { autenticacion_2FA: false },
      });
    } catch (error) {
      console.error("Error al desactivar 2FA:", error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Error interno del servidor.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message: "Parámetros inválidos.",
    },
    { status: 400 }
  );
}

// Mantener el PUT para actualizaciones de perfil general
export async function PUT(request: NextRequest) {
  await connectDB();

  // Verificar autenticación
  const userPayload = requireAuth(request);
  if (!userPayload) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "No autenticado.",
      },
      { status: 401 }
    );
  }

  // Obtener usuario completo de la base de datos
  const user = await Usuario.findById(userPayload.userId);
  if (!user) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Usuario no encontrado.",
      },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { nombre_completo, telefono } = body;

  try {
    if (nombre_completo !== undefined) {
      user.nombre_completo = nombre_completo;
    }
    if (telefono !== undefined) {
      user.telefono = telefono;
    }

    await (user as unknown as { save?: () => Promise<void> }).save?.();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Perfil actualizado exitosamente.",
      data: {
        nombre_completo: user.nombre_completo,
        telefono: user.telefono,
      },
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
