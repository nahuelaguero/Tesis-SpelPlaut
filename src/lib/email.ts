import nodemailer from "nodemailer";

// Singleton del transporter para reusar conexiones TLS
let cachedTransporter: nodemailer.Transporter | null = null;
let hasLoggedMissingEmailConfig = false;
let cachedGmailTransporter: nodemailer.Transporter | null = null;
let cachedSmtpTransporter: nodemailer.Transporter | null = null;

const getSmtpPassword = () =>
  process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const getEmailPassword = () =>
  process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

type MailProvider = "smtp" | "gmail";

const getSmtpTransporter = (): nodemailer.Transporter | null => {
  if (cachedSmtpTransporter) return cachedSmtpTransporter;
  const smtpPassword = getSmtpPassword();
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !smtpPassword) {
    return null;
  }

  cachedSmtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPassword,
    },
  });
  return cachedSmtpTransporter;
};

const getGmailTransporter = (): nodemailer.Transporter | null => {
  if (cachedGmailTransporter) return cachedGmailTransporter;
  const emailPassword = getEmailPassword();
  if (!process.env.EMAIL_USER || !emailPassword) return null;
  cachedGmailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: emailPassword,
    },
  });
  return cachedGmailTransporter;
};

const getProviderOrder = (): MailProvider[] => {
  // Se mantiene preferencia SMTP para producción, con fallback real a Gmail.
  const order: MailProvider[] = [];
  if (getSmtpTransporter()) order.push("smtp");
  if (getGmailTransporter()) order.push("gmail");
  return order;
};

const getTransporter = (): nodemailer.Transporter | null => {
  if (cachedTransporter) return cachedTransporter;
  const [primaryProvider] = getProviderOrder();
  if (primaryProvider === "smtp") {
    cachedTransporter = getSmtpTransporter();
    return cachedTransporter;
  }
  if (primaryProvider === "gmail") {
    cachedTransporter = getGmailTransporter();
    return cachedTransporter;
  }

  if (!hasLoggedMissingEmailConfig) {
    console.warn(
      "⚠️ Email deshabilitado: falta configurar SMTP_HOST/SMTP_USER/SMTP_PASSWORD (o SMTP_PASS), o EMAIL_USER/EMAIL_PASSWORD (o EMAIL_PASS)."
    );
    hasLoggedMissingEmailConfig = true;
  }

  return null;
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Función base para enviar emails
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  const providers = getProviderOrder();
  if (providers.length === 0) {
    // Dispara warning de config una sola vez.
    getTransporter();
    return false;
  }

  try {
    const smtpPassword = getSmtpPassword();
    const emailPassword = getEmailPassword();
    const usingGmailFallback = Boolean(
      process.env.EMAIL_USER &&
        emailPassword &&
        (!process.env.SMTP_HOST || !process.env.SMTP_USER || !smtpPassword)
    );
    for (const provider of providers) {
      const transporter =
        provider === "smtp" ? getSmtpTransporter() : getGmailTransporter();
      if (!transporter) continue;
      const usingGmail = provider === "gmail";
      const fromAddress = usingGmail
        ? process.env.EMAIL_USER
        : process.env.EMAIL_FROM ||
          process.env.SMTP_USER ||
          process.env.EMAIL_USER ||
          "noreply@spelplaut.com";

      const mailOptions = {
        from: `"SpelPlaut - Reservas" <${fromAddress}>`,
        replyTo:
          usingGmail &&
          process.env.EMAIL_FROM &&
          process.env.EMAIL_FROM !== process.env.EMAIL_USER
            ? process.env.EMAIL_FROM
            : undefined,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      try {
        const result = await transporter.sendMail(mailOptions);
        if (usingGmail && !usingGmailFallback && process.env.NODE_ENV === "production") {
          console.warn(
            "⚠️ Envío realizado por Gmail fallback después de fallar SMTP."
          );
        }
        console.log(
          `✅ Email enviado exitosamente a ${emailData.to} via ${provider}`,
          result.messageId
        );
        return true;
      } catch (providerError) {
        console.error(`❌ Falló envío por ${provider}:`, providerError);
      }
    }
    return false;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
};

// Template base para emails
const getBaseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        .button {
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .warning-box {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .text-center { text-align: center; }
        .text-gray { color: #64748b; }
        .text-green { color: #059669; }
        .font-bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SpelPlaut</h1>
            <p>Spel en Loma Plata</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© 2024 SpelPlaut - Reserva de Canchas</p>
            <p>Centro Deportivo, Loma Plata, Paraguay</p>
            <p class="text-gray">Este es un email automático, no responder a esta dirección.</p>
        </div>
    </div>
</body>
</html>
`;

// Email de confirmación de reserva
export const sendReservationConfirmation = async (
  userEmail: string,
  userName: string,
  reservationData: {
    canchaName: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    precio: number;
    metodoPago: string;
    reservaId: string;
  }
) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      efectivo: "Efectivo (al llegar)",
      bancard_card: "Tarjeta Bancard",
      bancard_apple_pay: "Apple Pay via Bancard",
      bancard_google_pay: "Google Pay via Bancard",
      bancard_qr: "QR Bancard",
    };
    return methods[method] || method;
  };

  const content = `
    <h2>¡Reserva Confirmada! 🎾</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Tu reserva ha sido confirmada exitosamente. Aquí tienes los detalles:</p>
    
    <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">Detalles de la Reserva</h3>
        <p><strong>Cancha:</strong> ${reservationData.canchaName}</p>
        <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
        <p><strong>Horario:</strong> ${reservationData.horaInicio} - ${
          reservationData.horaFin
        }</p>
        <p><strong>Precio Total:</strong> <span class="text-green font-bold">${formatPrice(
          reservationData.precio
        )}</span></p>
        <p><strong>Método de Pago:</strong> ${getPaymentMethodText(
          reservationData.metodoPago
        )}</p>
        <p><strong>ID de Reserva:</strong> <code>${
          reservationData.reservaId
        }</code></p>
    </div>

    ${
      reservationData.metodoPago === "efectivo"
        ? `
    <div class="warning-box">
        <h4 style="margin-top: 0;">💰 Recordatorio de Pago</h4>
        <p>Has seleccionado <strong>pago en efectivo</strong>. Por favor, recuerda llevar el monto exacto al momento de tu reserva.</p>
    </div>
    `
        : `
    <div class="info-box">
        <h4 style="margin-top: 0;">✅ Pago Procesado</h4>
        <p>Tu pago ha sido procesado exitosamente via ${getPaymentMethodText(
          reservationData.metodoPago
        )}.</p>
    </div>
    `
    }

    <div class="text-center">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/mis-reservas" class="button">
            Ver Mis Reservas
        </a>
    </div>

    <h3>Información Importante:</h3>
    <ul>
        <li>Llega <strong>15 minutos antes</strong> de tu horario reservado</li>
        <li>Trae tu documento de identidad</li>
        <li>Si necesitas cancelar, hazlo con al menos 2 horas de anticipación</li>
    </ul>

    <p>¡Nos vemos en la cancha! 🏃‍♂️⚽</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Reserva Confirmada - ${reservationData.canchaName} - ${formatDate(
      reservationData.fecha
    )}`,
    html: getBaseTemplate(content, "Reserva Confirmada"),
    text: `¡Reserva Confirmada!\n\nHola ${userName},\n\nTu reserva para ${
      reservationData.canchaName
    } el ${formatDate(reservationData.fecha)} de ${
      reservationData.horaInicio
    } a ${reservationData.horaFin} ha sido confirmada.\n\nPrecio: ${formatPrice(
      reservationData.precio
    )}\nMétodo de pago: ${getPaymentMethodText(
      reservationData.metodoPago
    )}\nID de Reserva: ${
      reservationData.reservaId
    }\n\n¡Nos vemos en la cancha!`,
  });
};

// Email de recordatorio de reserva (24 horas antes)
export const sendReservationReminder = async (
  userEmail: string,
  userName: string,
  reservationData: {
    canchaName: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    metodoPago: string;
    reservaId: string;
  }
) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const content = `
    <h2>Recordatorio de Reserva ⏰</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Te recordamos que tienes una reserva <strong>mañana</strong>:</p>
    
    <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">Tu Reserva de Mañana</h3>
        <p><strong>Cancha:</strong> ${reservationData.canchaName}</p>
        <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
        <p><strong>Horario:</strong> ${reservationData.horaInicio} - ${
          reservationData.horaFin
        }</p>
        <p><strong>ID de Reserva:</strong> <code>${
          reservationData.reservaId
        }</code></p>
    </div>

    <h3>Checklist para mañana:</h3>
    <ul>
        <li>📄 Lleva tu documento de identidad</li>
        <li>⏰ Llega 15 minutos antes (${reservationData.horaInicio})</li>
        <li>👕 Viste ropa deportiva apropiada</li>
        ${
          reservationData.metodoPago === "efectivo"
            ? "<li>💰 No olvides el dinero en efectivo</li>"
            : ""
        }
        <li>🧴 Trae tu botella de agua</li>
    </ul>

    <div class="text-center">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/mis-reservas" class="button">
            Ver Mis Reservas
        </a>
    </div>

    <p>¡Esperamos verte mañana! 🎾</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Recordatorio: Reserva mañana - ${reservationData.canchaName}`,
    html: getBaseTemplate(content, "Recordatorio de Reserva"),
    text: `Recordatorio de Reserva\n\nHola ${userName},\n\nTe recordamos que tienes una reserva mañana:\n\nCancha: ${
      reservationData.canchaName
    }\nFecha: ${formatDate(reservationData.fecha)}\nHorario: ${
      reservationData.horaInicio
    } - ${reservationData.horaFin}\n\n¡No olvides llegar 15 minutos antes!`,
  });
};

// Email de cancelación de reserva
export const sendReservationCancellation = async (
  userEmail: string,
  userName: string,
  reservationData: {
    canchaName: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    reservaId: string;
    refundAmount?: number;
  }
) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const content = `
    <h2>Reserva Cancelada 🗑️</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Tu reserva ha sido <strong>cancelada exitosamente</strong>.</p>
    
    <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">Reserva Cancelada</h3>
        <p><strong>Cancha:</strong> ${reservationData.canchaName}</p>
        <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
        <p><strong>Horario:</strong> ${reservationData.horaInicio} - ${
          reservationData.horaFin
        }</p>
        <p><strong>ID de Reserva:</strong> <code>${
          reservationData.reservaId
        }</code></p>
    </div>

    ${
      reservationData.refundAmount
        ? `
    <div class="info-box">
        <h4 style="margin-top: 0;">💰 Reembolso</h4>
        <p>Se procesará un reembolso de <strong>${formatPrice(
          reservationData.refundAmount
        )}</strong> a tu método de pago original en los próximos 3-5 días hábiles.</p>
    </div>
    `
        : ""
    }

    <div class="text-center">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/canchas" class="button">
            Explorar Canchas
        </a>
    </div>

    <p>Esperamos verte pronto en SpelPlaut. ¡Siempre puedes hacer una nueva reserva!</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Reserva Cancelada - ${reservationData.canchaName}`,
    html: getBaseTemplate(content, "Reserva Cancelada"),
    text: `Reserva Cancelada\n\nHola ${userName},\n\nTu reserva para ${
      reservationData.canchaName
    } el ${formatDate(
      reservationData.fecha
    )} ha sido cancelada exitosamente.\n\nID de Reserva: ${
      reservationData.reservaId
    }\n\nGracias por usar SpelPlaut.`,
  });
};

// Email de recuperación de contraseña
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetData: {
    resetUrl: string;
    userName: string;
    expiresIn: string;
  }
) => {
  const content = `
    <h2>Restablecer Contraseña 🔐</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en SpelPlaut.</p>
    
    <div class="info-box">
        <h3 style="margin-top: 0; color: #3b82f6;">Instrucciones</h3>
        <p>Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>${resetData.expiresIn}</strong>.</p>
    </div>

    <div class="text-center" style="margin: 30px 0;">
        <a href="${resetData.resetUrl}" class="button" style="background-color: #059669 !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Restablecer Contraseña
        </a>
    </div>

    <div class="info-box" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
        <h4 style="margin-top: 0; color: #d97706;">⚠️ Importante</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Si no solicitaste este cambio, ignora este email</li>
            <li>No compartas este enlace con nadie</li>
            <li>El enlace expira en ${resetData.expiresIn}</li>
        </ul>
    </div>

    <p>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetData.resetUrl}</p>

    <p>¿Necesitas ayuda? Contáctanos respondiendo a este email.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: "Restablecer Contraseña - SpelPlaut",
    html: getBaseTemplate(content, "Restablecer Contraseña"),
    text: `Restablecer Contraseña\n\nHola ${userName},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nEnlace: ${resetData.resetUrl}\n\nEste enlace expira en ${resetData.expiresIn}.\n\nSi no solicitaste este cambio, ignora este email.\n\nSpelPlaut`,
  });
};

export const sendReservationPendingApproval = async (
  userEmail: string,
  userName: string,
  reservationData: {
    canchaName: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    precio: number;
    reservaId: string;
  }
) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);

  const content = `
    <h2>Reserva Recibida ⏳</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Tu solicitud de reserva fue registrada y ahora está <strong>pendiente de aprobación</strong> por parte del propietario.</p>
    <div class="info-box">
        <p><strong>Cancha:</strong> ${reservationData.canchaName}</p>
        <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
        <p><strong>Horario:</strong> ${reservationData.horaInicio} - ${reservationData.horaFin}</p>
        <p><strong>Precio estimado:</strong> ${formatPrice(reservationData.precio)}</p>
        <p><strong>ID de Reserva:</strong> <code>${reservationData.reservaId}</code></p>
    </div>
    <p>Te avisaremos por email cuando el propietario la apruebe o rechace.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Reserva pendiente de aprobación - ${reservationData.canchaName}`,
    html: getBaseTemplate(content, "Reserva Pendiente"),
    text: `Reserva pendiente de aprobación\n\nHola ${userName}, tu reserva para ${reservationData.canchaName} el ${formatDate(
      reservationData.fecha
    )} de ${reservationData.horaInicio} a ${
      reservationData.horaFin
    } quedó pendiente de aprobación.`,
  });
};

export const sendOwnerReservationPendingApproval = async (
  ownerEmail: string,
  ownerName: string,
  reservationData: {
    canchaName: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    precio: number;
    reservaId: string;
    customerName: string;
    customerEmail: string;
  }
) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);

  const content = `
    <h2>Nueva reserva pendiente 🏟️</h2>
    <p>Hola <strong>${ownerName}</strong>,</p>
    <p>Tienes una nueva reserva que requiere tu aprobación manual.</p>
    <div class="info-box">
        <p><strong>Cancha:</strong> ${reservationData.canchaName}</p>
        <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
        <p><strong>Horario:</strong> ${reservationData.horaInicio} - ${reservationData.horaFin}</p>
        <p><strong>Precio:</strong> ${formatPrice(reservationData.precio)}</p>
        <p><strong>Cliente:</strong> ${reservationData.customerName}</p>
        <p><strong>Email cliente:</strong> ${reservationData.customerEmail}</p>
        <p><strong>ID de Reserva:</strong> <code>${reservationData.reservaId}</code></p>
    </div>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject: `Reserva pendiente para aprobar - ${reservationData.canchaName}`,
    html: getBaseTemplate(content, "Reserva Pendiente para Aprobar"),
    text: `Nueva reserva pendiente\n\n${reservationData.customerName} solicitó ${reservationData.canchaName} el ${formatDate(
      reservationData.fecha
    )} de ${reservationData.horaInicio} a ${reservationData.horaFin}.`,
  });
};

export const sendReservationRejected = async (
  userEmail: string,
  userName: string,
  reservationData: {
    canchaName: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    motivo?: string;
  }
) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const content = `
    <h2>Reserva rechazada</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>El propietario rechazó tu solicitud de reserva.</p>
    <div class="warning-box">
        <p><strong>Cancha:</strong> ${reservationData.canchaName}</p>
        <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
        <p><strong>Horario:</strong> ${reservationData.horaInicio} - ${reservationData.horaFin}</p>
        ${
          reservationData.motivo
            ? `<p><strong>Motivo:</strong> ${reservationData.motivo}</p>`
            : ""
        }
    </div>
    <p>Puedes intentar con otro horario desde la app.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Reserva rechazada - ${reservationData.canchaName}`,
    html: getBaseTemplate(content, "Reserva Rechazada"),
    text: `Reserva rechazada\n\nHola ${userName}, tu solicitud para ${
      reservationData.canchaName
    } el ${formatDate(reservationData.fecha)} de ${
      reservationData.horaInicio
    } a ${reservationData.horaFin} fue rechazada.${
      reservationData.motivo ? ` Motivo: ${reservationData.motivo}` : ""
    }`,
  });
};

export const send2FAEmail = async (
  userEmail: string,
  userName: string,
  code: string
) => {
  const content = `
    <h2>Verificación en dos pasos (2FA) 🔐</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Tu código de verificación es:</p>
    <div style="font-size: 2rem; font-weight: bold; color: #059669; margin: 20px 0;">${code}</div>
    <p>Este código es válido por 10 minutos. Si no solicitaste este código, ignora este mensaje.</p>
    <p>¿Necesitas ayuda? Contáctanos respondiendo a este email.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: "Tu código de verificación 2FA - SpelPlaut",
    html: getBaseTemplate(content, "Verificación 2FA"),
    text: `Verificación en dos pasos (2FA)\n\nHola ${userName},\n\nTu código de verificación es: ${code}\n\nEste código es válido por 10 minutos. Si no solicitaste este código, ignora este mensaje.\n\nSpelPlaut`,
  });
};
