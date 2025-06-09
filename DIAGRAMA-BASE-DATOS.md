# 🏟️ SPELPLAUT - DIAGRAMA BASE DE DATOS

## 📊 MODELO LÓGICO (Entidades y Relaciones)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USUARIO   │────│   RESERVA   │────│   CANCHA    │
│             │    │             │    │             │
│ • ID        │    │ • ID        │    │ • ID        │
│ • Nombre    │    │ • Usuario   │    │ • Nombre    │
│ • Email     │    │ • Cancha    │    │ • Tipo      │
│ • Teléfono  │    │ • Fecha     │    │ • Ubicación │
│ • Rol       │    │ • Hora      │    │ • Precio    │
│ • Contraseña│    │ • Estado    │    │ • Capacidad │
└─────────────┘    │ • Precio    │    │ • Horarios  │
       │           └─────────────┘    └─────────────┘
       │                  │                  │
       │           ┌─────────────┐    ┌─────────────┐
       │           │CALIFICACIÓN │    │DISPONIBILIDAD│
       └───────────│             │    │             │
                   │ • ID        │    │ • ID        │
                   │ • Usuario   │    │ • Cancha    │
                   │ • Cancha    │    │ • Fecha     │
                   │ • Reserva   │    │ • Horarios  │
                   │ • Puntuación│    │ • Estado    │
                   │ • Comentario│    └─────────────┘
                   └─────────────┘

   ┌─────────────────────────────────────────────────┐
   │              NOTIFICACIÓN                       │
   │ • ID • Usuario • Tipo • Mensaje • Estado       │
   └─────────────────────────────────────────────────┘
```

## 🗂️ ESTRUCTURA FÍSICA MONGODB

### **Colección: usuarios**

```json
{
  "_id": "ObjectId",
  "nombre_completo": "String",
  "email": "String (único)",
  "telefono": "String",
  "contrasena_hash": "String",
  "rol": "usuario|propietario_cancha|admin",
  "verificado": "Boolean",
  "fecha_registro": "Date",
  "configuracion_notificaciones": {
    "email": "Boolean",
    "push": "Boolean"
  }
}
```

### **Colección: canchas**

```json
{
  "_id": "ObjectId",
  "propietario_id": "ObjectId → usuarios",
  "nombre": "String",
  "descripcion": "String",
  "tipo_cancha": "futbol|futsal|basquet|tenis|padel|voleibol",
  "ubicacion": "String",
  "coordenadas": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "precio_por_hora": "Number",
  "capacidad_jugadores": "Number",
  "horario_apertura": "String (HH:MM)",
  "horario_cierre": "String (HH:MM)",
  "imagenes": ["String"],
  "servicios_adicionales": ["String"],
  "activa": "Boolean",
  "calificacion_promedio": "Number"
}
```

### **Colección: reservas**

```json
{
  "_id": "ObjectId",
  "usuario_id": "ObjectId → usuarios",
  "cancha_id": "ObjectId → canchas",
  "fecha": "Date",
  "hora_inicio": "String (HH:MM)",
  "hora_fin": "String (HH:MM)",
  "estado": "pendiente|confirmada|cancelada|completada",
  "precio_total": "Number",
  "metodo_pago": "efectivo|transferencia|tarjeta",
  "notas": "String",
  "fecha_reserva": "Date"
}
```

### **Colección: calificaciones**

```json
{
  "_id": "ObjectId",
  "usuario_id": "ObjectId → usuarios",
  "cancha_id": "ObjectId → canchas",
  "reserva_id": "ObjectId → reservas",
  "puntuacion": "Number (1-5)",
  "comentario": "String",
  "fecha_calificacion": "Date"
}
```

### **Colección: disponibilidad**

```json
{
  "_id": "ObjectId",
  "cancha_id": "ObjectId → canchas",
  "fecha": "Date",
  "horarios_ocupados": [
    {
      "hora_inicio": "String",
      "hora_fin": "String",
      "reserva_id": "ObjectId"
    }
  ],
  "horarios_bloqueados": [
    {
      "hora_inicio": "String",
      "hora_fin": "String",
      "motivo": "String"
    }
  ]
}
```

### **Colección: notificaciones**

```json
{
  "_id": "ObjectId",
  "usuario_id": "ObjectId → usuarios",
  "tipo": "reserva_confirmada|recordatorio_24h|cancelacion",
  "titulo": "String",
  "mensaje": "String",
  "datos_adicionales": {
    "reserva_id": "ObjectId",
    "cancha_nombre": "String"
  },
  "leida": "Boolean",
  "fecha_envio": "Date"
}
```

## 🔍 ÍNDICES IMPORTANTES

### **Rendimiento y Búsquedas:**

- **usuarios**: email (único), rol
- **canchas**: coordenadas (2dsphere), tipo_cancha, activa
- **reservas**: usuario_id, cancha_id, fecha+hora_inicio
- **disponibilidad**: cancha_id+fecha (único compuesto)
- **calificaciones**: cancha_id, reserva_id (único)

### **Funcionalidades Clave:**

✅ Búsqueda geoespacial por ubicación
✅ Filtros por tipo de deporte y precio
✅ Control de disponibilidad en tiempo real
✅ Sistema de calificaciones y reseñas
✅ Notificaciones automáticas
✅ Gestión de usuarios y roles

---

**SpelPlaut** - Sistema de Reservas de Canchas Deportivas
Loma Plata, Paraguay 🇵🇾
