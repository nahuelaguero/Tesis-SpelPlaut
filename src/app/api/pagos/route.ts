import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { requireAuth, isValidObjectId } from "@/lib/auth";
import { ApiResponse } from "@/types";
import Usuario from "@/models/Usuario";

export async function POST(request: NextRequest) {
  try {
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
    const { reserva_id, metodo_pago, monto, referencia_pago } = body;

    // Validaciones básicas
    if (!reserva_id || !metodo_pago || !monto) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Todos los campos son requeridos: reserva_id, metodo_pago, monto",
        },
        { status: 400 }
      );
    }

    if (!isValidObjectId(reserva_id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "ID de reserva inválido",
        },
        { status: 400 }
      );
    }

    // Validar método de pago
    const metodosValidos = ["efectivo", "transferencia", "tarjeta"];
    if (!metodosValidos.includes(metodo_pago)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Método de pago inválido. Debe ser: efectivo, transferencia o tarjeta",
        },
        { status: 400 }
      );
    }

    // Validar monto
    if (typeof monto !== "number" || monto <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "El monto debe ser un número mayor a 0",
        },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reserva = await Reserva.findById(reserva_id).populate("cancha_id");
    if (!reserva) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Reserva no encontrada",
        },
        { status: 404 }
      );
    }

    // Verificar que el usuario puede pagar esta reserva
    const isOwner = reserva.usuario_id.toString() === user._id?.toString();
    const isAdmin = user.rol === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No tienes permiso para pagar esta reserva",
        },
        { status: 403 }
      );
    }

    // Verificar que la reserva no esté cancelada
    if (reserva.estado === "cancelada") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "No se puede pagar una reserva cancelada",
        },
        { status: 400 }
      );
    }

    // Verificar que no esté ya pagada
    if (reserva.pagado) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Esta reserva ya está pagada",
        },
        { status: 400 }
      );
    }

    // Calcular el monto esperado basado en la duración y precio de la cancha
    const [horaInicioHours, horaInicioMinutes] = reserva.hora_inicio
      .split(":")
      .map(Number);
    const [horaFinHours, horaFinMinutes] = reserva.hora_fin
      .split(":")
      .map(Number);
    const inicioTotalMinutes = horaInicioHours * 60 + horaInicioMinutes;
    const finTotalMinutes = horaFinHours * 60 + horaFinMinutes;
    const durationHours = (finTotalMinutes - inicioTotalMinutes) / 60;
    const montoEsperado = durationHours * reserva.cancha_id.precio_hora;

    // Verificar que el monto sea correcto (permitir variación del 1% por redondeos)
    const variacionPermitida = montoEsperado * 0.01;
    if (Math.abs(monto - montoEsperado) > variacionPermitida) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `El monto debe ser ${montoEsperado.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Procesar el pago (aquí se integraría con un procesador de pagos real)
    let pagoExitoso = false;
    let referenciaGenerada = referencia_pago;

    switch (metodo_pago) {
      case "efectivo":
        // Para efectivo, se asume que será pagado en persona
        pagoExitoso = true;
        referenciaGenerada = `EF-${Date.now()}`;
        break;

      case "transferencia":
        // Para transferencia, se requiere referencia
        if (!referencia_pago) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "Se requiere referencia de transferencia",
            },
            { status: 400 }
          );
        }
        pagoExitoso = true;
        break;

      case "tarjeta":
        // Aquí se integraría con un procesador de pagos como Stripe, PayPal, etc.
        // Por ahora simulamos el procesamiento
        pagoExitoso = true;
        referenciaGenerada = `TC-${Date.now()}`;
        break;
    }

    if (!pagoExitoso) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Error al procesar el pago. Inténtalo nuevamente",
        },
        { status: 400 }
      );
    }

    // Actualizar la reserva con la información del pago
    const updatedReserva = await Reserva.findByIdAndUpdate(
      reserva_id,
      {
        pagado: true,
        estado: "confirmada",
        informacion_pago: {
          metodo: metodo_pago,
          monto,
          fecha_pago: new Date(),
          referencia: referenciaGenerada,
          procesado_por: user._id,
        },
      },
      { new: true }
    )
      .populate("cancha_id", "nombre tipo ubicacion precio_hora")
      .populate("usuario_id", "nombre_completo email telefono");

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Pago procesado exitosamente",
        data: {
          reserva: updatedReserva,
          pago: {
            metodo: metodo_pago,
            monto,
            referencia: referenciaGenerada,
            fecha: new Date(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al procesar pago:", error);

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

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get("usuario_id");
    const metodo = searchParams.get("metodo");
    const fecha_desde = searchParams.get("fecha_desde");
    const fecha_hasta = searchParams.get("fecha_hasta");

    // Construir filtros
    const filters: Record<string, unknown> = { pagado: true };

    // Si no es admin, solo puede ver sus propios pagos
    if (user.rol !== "admin") {
      filters.usuario_id = user._id;
    } else if (usuario_id) {
      if (!isValidObjectId(usuario_id)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "ID de usuario inválido",
          },
          { status: 400 }
        );
      }
      filters.usuario_id = usuario_id;
    }

    if (metodo) {
      filters["informacion_pago.metodo"] = metodo;
    }

    if (fecha_desde || fecha_hasta) {
      const dateFilter: Record<string, unknown> = {};

      if (fecha_desde) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_desde)) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "Formato de fecha_desde inválido. Use YYYY-MM-DD",
            },
            { status: 400 }
          );
        }
        dateFilter.$gte = new Date(fecha_desde);
      }

      if (fecha_hasta) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_hasta)) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              message: "Formato de fecha_hasta inválido. Use YYYY-MM-DD",
            },
            { status: 400 }
          );
        }
        const hasta = new Date(fecha_hasta);
        hasta.setHours(23, 59, 59, 999); // Incluir todo el día
        dateFilter.$lte = hasta;
      }

      filters["informacion_pago.fecha_pago"] = dateFilter;
    }

    const pagos = await Reserva.find(filters, {
      _id: 1,
      fecha: 1,
      hora_inicio: 1,
      hora_fin: 1,
      informacion_pago: 1,
      usuario_id: 1,
      cancha_id: 1,
    })
      .populate("cancha_id", "nombre tipo precio_hora")
      .populate("usuario_id", "nombre_completo email")
      .sort({ "informacion_pago.fecha_pago": -1 });

    // Calcular estadísticas si es admin
    let estadisticas = null;
    if (user.rol === "admin") {
      const totalPagos = pagos.length;
      const montoTotal = pagos.reduce(
        (sum, pago) => sum + (pago.informacion_pago?.monto || 0),
        0
      );
      const metodosFrecuentes = pagos.reduce(
        (acc: Record<string, number>, pago) => {
          const metodo = pago.informacion_pago?.metodo || "unknown";
          acc[metodo] = (acc[metodo] || 0) + 1;
          return acc;
        },
        {}
      );

      estadisticas = {
        total_pagos: totalPagos,
        monto_total: montoTotal,
        metodos_frecuentes: metodosFrecuentes,
      };
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Historial de pagos obtenido exitosamente",
      data: {
        pagos,
        ...(estadisticas && { estadisticas }),
      },
    });
  } catch (error) {
    console.error("Error al obtener historial de pagos:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
