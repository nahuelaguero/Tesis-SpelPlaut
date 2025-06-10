# 📧 Configuración de Email - SpelPlaut

## 🎯 **Opciones Disponibles**

### 1. **Modo MOCK (Desarrollo - Sin configuración)** ⭐ **Recomendado para empezar**

Sin configurar nada, los emails se muestran solo en la consola:

```env
# No agregar nada - funcionará automáticamente
```

**Resultado:**

- ✅ Los emails se muestran en consola con formato bonito
- ✅ Se guardan en archivo `dev-emails.log`
- ✅ No necesita credenciales reales
- ✅ Perfecto para desarrollo

---

### 2. **Ethereal Email (Gratis - Emails reales pero de prueba)** 🆓

Cuenta automática que genera enlaces para ver emails:

```env
EMAIL_SERVICE=ethereal
```

**Resultado:**

- ✅ Envía emails reales a un servidor de prueba
- ✅ Genera enlaces para ver los emails enviados
- ✅ No necesita registro ni credenciales
- ✅ Perfecto para testing

---

### 3. **Mailtrap (Sandbox profesional)** 🧪

Servicio profesional para testing (requiere cuenta gratuita):

```env
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=tu-usuario-de-mailtrap
MAILTRAP_PASS=tu-password-de-mailtrap
```

**Registro:** https://mailtrap.io (plan gratuito disponible)

---

### 4. **Gmail Personal/Genérico** 📧

Usando Gmail con App Password:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail
EMAIL_FROM=noreply@spelplaut.com
```

**Cómo generar App Password:**

1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos"
3. Ir a "Contraseñas de aplicaciones"
4. Generar nueva contraseña para "Correo"
5. Usar esa contraseña (no tu contraseña normal)

---

### 5. **SMTP Genérico** 🌐

Para cualquier proveedor SMTP:

```env
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASSWORD=tu-password
EMAIL_FROM=noreply@tu-dominio.com
```

---

## 🚀 **Configuración Rápida**

### Para Desarrollo Inmediato:

```bash
# Opción 1: Sin configurar nada (modo MOCK)
# Solo ejecuta la app - funcionará automáticamente

# Opción 2: Ethereal (emails reales de prueba)
echo "EMAIL_SERVICE=ethereal" >> .env.local
```

### Para Producción:

```env
# SendGrid (recomendado)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=tu-api-key-de-sendgrid
EMAIL_FROM=noreply@tu-dominio.com

# O Mailgun
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=tu-usuario@tu-dominio
SMTP_PASSWORD=tu-password-mailgun
EMAIL_FROM=noreply@tu-dominio.com
```

---

## 📋 **Emails que se Envían**

1. **Confirmación de Reserva** - Al crear una reserva
2. **Recordatorio** - 24 horas antes de la reserva
3. **Cancelación** - Al cancelar una reserva
4. **Reset de Contraseña** - Al solicitar cambio de password

---

## 🔧 **Troubleshooting**

### Si ves errores de Gmail:

- Verifica que tengas "Verificación en 2 pasos" activada
- Usa "Contraseña de aplicación", no tu contraseña normal
- Asegúrate que "Acceso de apps menos seguras" esté desactivado

### Si quieres cambiar entre modos:

```bash
# Cambiar a modo mock
rm .env.local  # O eliminar las variables de email

# Cambiar a Ethereal
echo "EMAIL_SERVICE=ethereal" > .env.local

# Cambiar a Gmail
echo "EMAIL_USER=tu@gmail.com" > .env.local
echo "EMAIL_PASSWORD=tu-app-password" >> .env.local
```

---

## 🎨 **Lo que Verás**

### Modo MOCK (Consola):

```
================================================================================
📧 EMAIL SIMULADO (Modo Desarrollo)
================================================================================
📨 Para: usuario@ejemplo.com
📋 Asunto: Confirmación de Reserva - Cancha de Fútbol
📄 De: "SpelPlaut - Reservas" <noreply@spelplaut.com>
--------------------------------------------------------------------------------
📝 CONTENIDO:
Hola Juan,
Tu reserva ha sido confirmada...
--------------------------------------------------------------------------------
🔗 Para ver el HTML completo, revisa el archivo de logs
================================================================================
📁 Email guardado en: /tu-proyecto/dev-emails.log
```

### Ethereal Email:

```
✅ Email enviado a Ethereal: usuario@ejemplo.com
🔗 Ver email en: https://ethereal.email/message/abc123
```

### Gmail Real:

```
✅ Email enviado exitosamente a usuario@ejemplo.com mensaje-id-123
```

---

¡Con estas opciones puedes usar emails simulados O reales según necesites! 🎉
