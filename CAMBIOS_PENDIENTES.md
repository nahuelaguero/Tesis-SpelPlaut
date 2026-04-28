# Cambios Pendientes – Implementar Manualmente

## 1. Actualizar `src/app/api/reservas/route.ts` (POST handler)

Este archivo requiere 3 cambios en la función POST que crea reservas:

### A) Agregar imports al inicio del archivo

```typescript
import { sendPropietarioReservaPendiente } from "@/lib/email";
// Si no está ya importado:
import Usuario from "@/models/Usuario";
```

### B) Agregar función helper de precios dinámicos (antes del handler POST)

```typescript
function calcularPrecioConPreciosDinamicos(
  horaInicio: string,
  horaFin: string,
  precioBase: number,
  preciosPorHorario: { hora: string; precio: number }[] = []
): { precio_total: number; desglose: { hora: string; precio: number }[] } {
  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  const startMin = timeToMinutes(horaInicio);
  const endMin = timeToMinutes(horaFin);
  const desglose: { hora: string; precio: number }[] = [];
  let total = 0;

  for (let m = startMin; m < endMin; m += 60) {
    const slotHora = `${Math.floor(m / 60)
      .toString()
      .padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
    const minutos = Math.min(60, endMin - m);
    const fraccion = minutos / 60;
    const config = preciosPorHorario.find((p) => p.hora === slotHora);
    const precioHora = config ? config.precio : precioBase;
    const parcial = precioHora * fraccion;
    desglose.push({ hora: slotHora, precio: Math.round(parcial) });
    total += parcial;
  }
  return { precio_total: Math.round(total), desglose };
}
```

### C) Modificar el handler POST

Buscar donde se calcula `precio_total` (algo como `precio_total = cancha.precio_por_hora * duracion_horas`) y reemplazar con:

```typescript
// Calcular precio con precios dinámicos
const { precio_total, desglose: desglose_precios } =
  calcularPrecioConPreciosDinamicos(
    hora_inicio,
    hora_fin,
    cancha.precio_por_hora,
    cancha.precios_por_horario || []
  );
```

Buscar donde se crea la reserva (new Reserva({...})) y agregar el campo `desglose_precios`:

```typescript
const nuevaReserva = new Reserva({
  // ...campos existentes...
  precio_total,
  desglose_precios,
  // Si la cancha tiene aprobación automática, confirmar de una; si no, queda "pendiente"
  estado: cancha.aprobacion_automatica !== false ? "confirmada" : "pendiente",
});
```

Después de `await nuevaReserva.save()`, agregar:

```typescript
// Si la cancha NO tiene aprobación automática, notificar al propietario
if (cancha.aprobacion_automatica === false) {
  try {
    const propietario = await Usuario.findById(cancha.propietario_id).select(
      "email nombre_completo"
    );
    if (propietario?.email) {
      const usuarioReserva = await Usuario.findById(
        nuevaReserva.usuario_id
      ).select("nombre_completo email telefono");
      await sendPropietarioReservaPendiente(propietario.email, {
        propietarioNombre: propietario.nombre_completo,
        canchaName: cancha.nombre,
        usuarioNombre: usuarioReserva?.nombre_completo || "Usuario",
        usuarioEmail: usuarioReserva?.email || "",
        usuarioTelefono: usuarioReserva?.telefono,
        fecha: nuevaReserva.fecha,
        horaInicio: nuevaReserva.hora_inicio,
        horaFin: nuevaReserva.hora_fin,
        precio: nuevaReserva.precio_total,
        reservaId: nuevaReserva._id?.toString() || "",
      });
    }
  } catch (emailError) {
    console.error("Error enviando notificación al propietario:", emailError);
    // No interrumpir el flujo si falla el email
  }
}
```

---

## 2. Actualizar `src/app/api/propietario/dashboard/route.ts`

Agregar la consulta de reservas pendientes de aprobación al final del handler GET, antes de devolver la respuesta.

```typescript
// Obtener reservas pendientes de aprobación manual (solo de canchas con aprobacion_automatica: false)
const canchasManual = canchas.filter((c) => c.aprobacion_automatica === false);
const canchaIdsManual = canchasManual.map((c) => c._id);

const reservas_pendientes_aprobacion =
  canchaIdsManual.length > 0
    ? await Reserva.find({
        cancha_id: { $in: canchaIdsManual },
        estado: "pendiente",
      })
        .sort({ fecha_reserva: 1 })
        .populate("usuario_id", "nombre_completo email telefono")
        .populate("cancha_id", "nombre")
        .lean()
    : [];

const reservasPendientesFormateadas = reservas_pendientes_aprobacion.map(
  (r) => ({
    _id: r._id?.toString(),
    fecha: r.fecha,
    hora_inicio: r.hora_inicio,
    hora_fin: r.hora_fin,
    precio_total: r.precio_total,
    fecha_reserva: r.fecha_reserva,
    cancha_id: (r.cancha_id as { _id: unknown })._id?.toString(),
    cancha_nombre: (r.cancha_id as { nombre: string }).nombre,
    usuario: {
      nombre_completo: (r.usuario_id as { nombre_completo: string })
        .nombre_completo,
      email: (r.usuario_id as { email: string }).email,
      telefono: (r.usuario_id as { telefono?: string }).telefono,
    },
  })
);
```

Y agregar `reservas_pendientes_aprobacion: reservasPendientesFormateadas` al objeto de respuesta.

---

## 3. Variables de entorno necesarias para AWS S3

Agregar al `.env.local`:

```bash
# AWS S3
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=spelplaut-canchas
```

Para crear el bucket S3:

1. Ir a AWS Console → S3 → Create Bucket
2. Nombre: `spelplaut-canchas` (o el que prefieras)
3. Región: us-east-1 (o la más cercana a Paraguay)
4. **Desmarcar** "Block all public access" (para que las imágenes sean públicas)
5. Habilitar ACL (Bucket owner preferred)

---

## 4. Correr `bun install` para instalar `@aws-sdk/client-s3`

```bash
bun install
```

O con npm:

```bash
npm install --legacy-peer-deps
```
