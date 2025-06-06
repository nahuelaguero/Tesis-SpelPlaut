import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface BancardPaymentRequest {
  reserva_id: string;
  metodo_pago:
    | "bancard_card"
    | "bancard_apple_pay"
    | "bancard_google_pay"
    | "bancard_qr";
  monto: number;
  card_data?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token de autenticación requerido" },
        { status: 401 }
      );
    }

    jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const { reserva_id, metodo_pago, monto }: BancardPaymentRequest =
      await request.json();

    // Validaciones básicas
    if (!reserva_id || !metodo_pago || !monto) {
      return NextResponse.json(
        { success: false, message: "Datos de pago incompletos" },
        { status: 400 }
      );
    }

    // Simular procesamiento con Bancard API
    console.log(`🔄 Procesando pago con Bancard...`);
    console.log(`💳 Método: ${metodo_pago}`);
    console.log(`💰 Monto: ${monto} PYG`);

    // Simular respuesta exitosa de Bancard
    const mockBancardResponse = {
      transaction_id: `BC${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      status: "approved",
      authorization_code: `AUTH${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`,
      payment_method: metodo_pago,
      amount: monto,
      currency: "PYG",
      processed_at: new Date().toISOString(),
      bancard_response: {
        response_code: "00",
        response_description: "Transacción aprobada",
        ticket_number: Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0"),
      },
    };

    // En producción, aquí haríamos la llamada real a Bancard
    // const bancardResponse = await callBancardAPI({
    //   amount: monto,
    //   currency: 'PYG',
    //   payment_method: metodo_pago,
    //   card_data: card_data
    // });

    return NextResponse.json({
      success: true,
      message: "Pago procesado exitosamente",
      data: {
        transaction_id: mockBancardResponse.transaction_id,
        status: mockBancardResponse.status,
        authorization_code: mockBancardResponse.authorization_code,
        payment_details: mockBancardResponse,
        next_steps: {
          update_reservation: true,
          send_confirmation: true,
          redirect_url: `/mis-reservas`,
        },
      },
    });
  } catch (error) {
    console.error("Error procesando pago Bancard:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Función para simular Apple Pay
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get("method");

  if (method === "apple_pay_validation") {
    // Simular validación de Apple Pay
    return NextResponse.json({
      success: true,
      apple_pay_session: {
        merchantIdentifier: "merchant.com.spelplaut.reservas",
        displayName: "SpelPlaut - Reserva de Canchas",
        initiative: "web",
        initiativeContext:
          request.headers.get("origin") || "https://spelplaut.com",
      },
    });
  }

  if (method === "google_pay_config") {
    // Simular configuración de Google Pay
    return NextResponse.json({
      success: true,
      google_pay_config: {
        environment:
          process.env.NODE_ENV === "production" ? "PRODUCTION" : "TEST",
        merchantId: "BCH12345678901234567890",
        merchantName: "SpelPlaut",
        gateway: "bancard",
        gatewayMerchantId: "SPELPLAUT_MERCHANT_ID",
      },
    });
  }

  return NextResponse.json(
    { success: false, message: "Método no soportado" },
    { status: 400 }
  );
}
