# Analisis de mejoras y casos no cubiertos

## Cambios cubiertos en esta iteracion

- Carga de multiples imagenes por cancha con soporte de backend para AWS S3.
- Precios dinamicos por dia y franja horaria.
- Intervalos de reserva configurables en multiplos de 15 minutos.
- Aprobacion automatica o manual de reservas por parte del propietario.
- Dashboard del propietario con reservas pendientes de aprobacion.
- Configuracion de cancha para precios, imagenes, horarios y modo de aprobacion.

## Casos de negocio que siguen siendo importantes para la tesis

### 1. Expiracion de reservas pendientes
- Si una reserva queda pendiente de aprobacion manual, hoy no expira sola.
- Riesgo: el horario puede quedar bloqueado demasiado tiempo si el propietario no responde.
- Recomendacion: agregar vencimiento automatico configurable, por ejemplo 15 o 30 minutos.

### 2. Precios especiales por fecha puntual
- El sistema actual soporta reglas por dias de la semana y hora.
- No contempla feriados, torneos, eventos especiales o promociones de un dia concreto.
- Recomendacion: agregar reglas por fecha exacta y prioridad.

### 3. Reembolso o compensacion al rechazar
- Si la reserva manual es rechazada, hoy se notifica al usuario pero no existe flujo de reembolso integrado.
- Recomendacion: si hay cobro online previo, modelar reembolso automatico o saldo a favor.

### 4. Push notifications reales
- No se verifico implementacion de tokens, permisos del navegador/dispositivo, ni envio por servicio push.
- Recomendacion: definir proveedor, almacenar tokens por usuario y eventos disparadores.

### 5. Login con redes sociales
- No se implemento Google, Apple o Facebook login.
- Recomendacion: si entra al alcance, resolver tambien linking de cuentas existentes para evitar duplicados.

### 6. Auditoria de decisiones del propietario
- Falta historial de quien aprobo/rechazo, motivo, fecha y canal.
- Recomendacion: registrar eventos de auditoria para trazabilidad administrativa.

### 7. Moderacion y orden de imagenes
- Se soportan varias imagenes, pero no hay reordenamiento visual, compresion, recorte ni validacion de contenido.
- Recomendacion: agregar imagen principal editable y optimizacion previa al upload.

### 8. Reglas de disponibilidad por franja
- Hoy el bloqueo de disponibilidad se maneja principalmente por fecha completa.
- No existe cierre parcial del tipo "ese dia de 14:00 a 18:00 no se reserva".
- Recomendacion: extender el modelo de disponibilidad a rangos horarios.

### 9. Conflictos concurrentes
- Hay validacion de superposicion antes de crear o aprobar reservas.
- En escenarios de alta concurrencia, conviene reforzar con transacciones o indices mas estrictos para evitar carrera.

### 10. Politica de cancelacion y penalidades
- No se parametriza si una reserva puede cancelarse hasta cierta hora ni si aplica cargo.
- Recomendacion: modelar reglas de cancelacion por cancha o plataforma.

### 11. Multi-cancha y roles
- El propietario puede tener varias canchas, pero aun falta revisar todos los flujos para asegurar consistencia total.
- Recomendacion: auditar reportes, pagina de disponibilidad y permisos por cancha.

### 12. Experiencia del usuario final
- La pantalla publica ya estima precios dinamicos, pero todavia puede mejorarse:
- mostrar desglose completo por franja antes de pagar
- indicar si la reserva entra confirmada o pendiente
- sugerir automaticamente horarios alternativos si uno falla

## Riesgos tecnicos y operativos

- La integracion S3 requiere variables `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` y opcionalmente `AWS_S3_PUBLIC_BASE_URL`.
- La dependencia `@aws-sdk/client-s3` debe instalarse localmente antes de usar uploads reales.
- El repo mostró problemas intermitentes para correr validaciones globales; conviene estabilizar ese punto antes de la entrega final.

## Recomendacion para defender en tesis

Separar claramente:

- alcance implementado: reservas, precios dinamicos, imagenes, aprobacion manual
- alcance propuesto como trabajo futuro: social login, push reales, reembolsos, vencimiento de pendientes, reglas por fecha especial

Eso fortalece la tesis porque muestra criterio de priorizacion, no solo lista de features.
