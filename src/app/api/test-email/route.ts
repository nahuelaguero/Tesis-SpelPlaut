import { NextRequest, NextResponse } from "next/server";
import { sendReservationConfirmation } from "@/lib/email";

// Endpoint para probar el sistema de email
export async function POST(request: NextRequest) {
  try {
    const { type = "test" } = await request.json();

    const testData = {
      usuario: {
        nombre_completo: "Nahuel Aguero",
        email: "nahuel.aguerosan@gmail.com",
      },
      cancha: {
        descripcion: "Cancha de Fútbol 5 - Centro Deportivo",
        ubicacion: "Loma Plata, Chaco, Paraguay",
        precio_por_hora: 150000,
      },
      fecha: "2024-01-20",
      hora_inicio: "19:00",
      hora_fin: "20:00",
      total: 150000,
      numero_reserva: "SPELPLAUT-TEST-001",
    };

    let success = false;

    switch (type) {
      case "confirmacion":
        success = await sendReservationConfirmation(
          testData.usuario.email,
          testData.usuario.nombre_completo,
          {
            canchaName: testData.cancha.descripcion,
            fecha: testData.fecha,
            horaInicio: testData.hora_inicio,
            horaFin: testData.hora_fin,
            precio: testData.total,
            metodoPago: "efectivo",
            reservaId: testData.numero_reserva,
          }
        );
        break;
      default:
        // Email de prueba simple
        const { sendEmail } = await import("@/lib/email");
        success = await sendEmail({
          to: "nahuel.aguerosan@gmail.com",
          subject: "🧪 Email de Prueba - SpelPlaut",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">¡Email de Prueba Exitoso! 🎉</h1>
              <p>Este es un email de prueba del sistema SpelPlaut.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Configuración Detectada:</h3>
                <ul>
                  <li><strong>Modo:</strong> ${process.env.NODE_ENV}</li>
                  <li><strong>Email Service:</strong> ${
                    process.env.EMAIL_SERVICE || "MOCK"
                  }</li>
                  <li><strong>Email User:</strong> ${
                    process.env.EMAIL_USER || "No configurado"
                  }</li>
                  <li><strong>SMTP Host:</strong> ${
                    process.env.SMTP_HOST || "No configurado"
                  }</li>
                </ul>
              </div>
              <p>Si ves este mensaje, el sistema de email está funcionando correctamente.</p>
              <p style="color: #6b7280; font-size: 14px;">
                SpelPlaut - Sistema de Reservas de Canchas
              </p>
            </div>
          `,
          text: `
¡Email de Prueba Exitoso!

Este es un email de prueba del sistema SpelPlaut.

Configuración Detectada:
- Modo: ${process.env.NODE_ENV}
- Email Service: ${process.env.EMAIL_SERVICE || "MOCK"}
- Email User: ${process.env.EMAIL_USER || "No configurado"}
- SMTP Host: ${process.env.SMTP_HOST || "No configurado"}

Si ves este mensaje, el sistema de email está funcionando correctamente.

SpelPlaut - Sistema de Reservas de Canchas
          `,
        });
    }

    return NextResponse.json({
      success,
      message: success
        ? "✅ Email enviado exitosamente"
        : "❌ Error enviando email",
      config: {
        mode: process.env.NODE_ENV,
        service: process.env.EMAIL_SERVICE || "MOCK",
        hasEmailUser: !!process.env.EMAIL_USER,
        hasSmtpHost: !!process.env.SMTP_HOST,
      },
    });
  } catch (error) {
    console.error("Error testing email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "❌ Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// También permitir GET para testing rápido
export async function GET() {
  return NextResponse.json({
    message: "🧪 Endpoint de prueba de email",
    instructions: "Envía POST para probar el email",
    availableTypes: ["test", "confirmacion"],
    config: {
      mode: process.env.NODE_ENV,
      service: process.env.EMAIL_SERVICE || "MOCK",
      hasEmailUser: !!process.env.EMAIL_USER,
      hasSmtpHost: !!process.env.SMTP_HOST,
    },
  });
}
