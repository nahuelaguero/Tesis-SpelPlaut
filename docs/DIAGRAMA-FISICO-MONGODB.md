# 🗄️ SPELPLAUT - DIAGRAMA FÍSICO MONGODB

## 📊 ESTRUCTURA FÍSICA DE BASE DE DATOS

```
MongoDB: spelplaut
├── Colecciones (6)
├── Índices (15 índices principales)
├── Validaciones de esquema
└── Configuraciones de rendimiento
```

## 🗂️ COLECCIONES Y ESQUEMAS FÍSICOS

### **📄 Colección: `usuarios`**

```json
{
  "collection": "usuarios",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": [
        "nombre_completo",
        "email",
        "telefono",
        "contrasena_hash",
        "rol"
      ],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "nombre_completo": {
          "bsonType": "string",
          "minLength": 2,
          "maxLength": 100
        },
        "email": {
          "bsonType": "string",
          "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        },
        "telefono": { "bsonType": "string", "minLength": 10, "maxLength": 15 },
        "contrasena_hash": { "bsonType": "string", "minLength": 60 },
        "rol": { "enum": ["usuario", "propietario_cancha", "admin"] },
        "verificado": { "bsonType": "bool", "default": false },
        "fecha_registro": { "bsonType": "date" },
        "ultima_conexion": { "bsonType": "date" },
        "configuracion_notificaciones": {
          "bsonType": "object",
          "properties": {
            "email": { "bsonType": "bool", "default": true },
            "push": { "bsonType": "bool", "default": true },
            "recordatorios": { "bsonType": "bool", "default": true }
          }
        }
      }
    }
  },
  "indexes": [
    { "key": { "_id": 1 } },
    { "key": { "email": 1 }, "unique": true },
    { "key": { "rol": 1 } },
    { "key": { "fecha_registro": -1 } },
    { "key": { "email": 1, "contrasena_hash": 1 } }
  ]
}
```

### **🏟️ Colección: `canchas`**

```json
{
  "collection": "canchas",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": [
        "propietario_id",
        "nombre",
        "tipo_cancha",
        "ubicacion",
        "precio_por_hora"
      ],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "propietario_id": { "bsonType": "objectId" },
        "nombre": { "bsonType": "string", "minLength": 3, "maxLength": 100 },
        "descripcion": { "bsonType": "string", "maxLength": 1000 },
        "tipo_cancha": {
          "enum": ["futbol", "futsal", "basquet", "tenis", "padel", "voleibol"]
        },
        "ubicacion": { "bsonType": "string", "minLength": 5, "maxLength": 200 },
        "coordenadas": {
          "bsonType": "object",
          "properties": {
            "type": { "enum": ["Point"] },
            "coordinates": {
              "bsonType": "array",
              "minItems": 2,
              "maxItems": 2,
              "items": { "bsonType": "double" }
            }
          }
        },
        "precio_por_hora": { "bsonType": "number", "minimum": 1000 },
        "capacidad_jugadores": {
          "bsonType": "int",
          "minimum": 2,
          "maximum": 50
        },
        "horario_apertura": {
          "bsonType": "string",
          "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
        },
        "horario_cierre": {
          "bsonType": "string",
          "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
        },
        "imagenes": { "bsonType": "array", "items": { "bsonType": "string" } },
        "servicios_adicionales": {
          "bsonType": "array",
          "items": { "bsonType": "string" }
        },
        "activa": { "bsonType": "bool", "default": true },
        "calificacion_promedio": {
          "bsonType": "number",
          "minimum": 0,
          "maximum": 5
        },
        "fecha_creacion": { "bsonType": "date" }
      }
    }
  },
  "indexes": [
    { "key": { "_id": 1 } },
    { "key": { "propietario_id": 1 } },
    { "key": { "coordenadas": "2dsphere" } },
    { "key": { "tipo_cancha": 1, "activa": 1 } },
    { "key": { "precio_por_hora": 1 } },
    { "key": { "calificacion_promedio": -1 } },
    { "key": { "activa": 1, "tipo_cancha": 1, "precio_por_hora": 1 } }
  ]
}
```

### **📅 Colección: `reservas`**

```json
{
  "collection": "reservas",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": [
        "usuario_id",
        "cancha_id",
        "fecha",
        "hora_inicio",
        "hora_fin",
        "estado"
      ],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "usuario_id": { "bsonType": "objectId" },
        "cancha_id": { "bsonType": "objectId" },
        "fecha": { "bsonType": "date" },
        "hora_inicio": {
          "bsonType": "string",
          "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
        },
        "hora_fin": {
          "bsonType": "string",
          "pattern": "^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
        },
        "estado": {
          "enum": ["pendiente", "confirmada", "cancelada", "completada"]
        },
        "precio_total": { "bsonType": "number", "minimum": 1000 },
        "metodo_pago": { "enum": ["efectivo", "transferencia", "tarjeta"] },
        "notas": { "bsonType": "string", "maxLength": 500 },
        "fecha_reserva": { "bsonType": "date" },
        "fecha_confirmacion": { "bsonType": "date" },
        "fecha_cancelacion": { "bsonType": "date" }
      }
    }
  },
  "indexes": [
    { "key": { "_id": 1 } },
    { "key": { "usuario_id": 1 } },
    { "key": { "cancha_id": 1 } },
    { "key": { "fecha": 1, "hora_inicio": 1 } },
    { "key": { "estado": 1 } },
    { "key": { "fecha_reserva": -1 } },
    { "key": { "cancha_id": 1, "fecha": 1, "estado": 1 } }
  ]
}
```

### **⭐ Colección: `calificaciones`**

```json
{
  "collection": "calificaciones",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": ["usuario_id", "cancha_id", "reserva_id", "puntuacion"],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "usuario_id": { "bsonType": "objectId" },
        "cancha_id": { "bsonType": "objectId" },
        "reserva_id": { "bsonType": "objectId" },
        "puntuacion": { "bsonType": "int", "minimum": 1, "maximum": 5 },
        "comentario": { "bsonType": "string", "maxLength": 1000 },
        "fecha_calificacion": { "bsonType": "date" }
      }
    }
  },
  "indexes": [
    { "key": { "_id": 1 } },
    { "key": { "reserva_id": 1 }, "unique": true },
    { "key": { "cancha_id": 1 } },
    { "key": { "usuario_id": 1 } },
    { "key": { "puntuacion": -1 } },
    { "key": { "fecha_calificacion": -1 } }
  ]
}
```

### **🕒 Colección: `disponibilidad`**

```json
{
  "collection": "disponibilidad",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": ["cancha_id", "fecha"],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "cancha_id": { "bsonType": "objectId" },
        "fecha": { "bsonType": "date" },
        "horarios_ocupados": {
          "bsonType": "array",
          "items": {
            "bsonType": "object",
            "properties": {
              "hora_inicio": { "bsonType": "string" },
              "hora_fin": { "bsonType": "string" },
              "reserva_id": { "bsonType": "objectId" }
            }
          }
        },
        "horarios_bloqueados": {
          "bsonType": "array",
          "items": {
            "bsonType": "object",
            "properties": {
              "hora_inicio": { "bsonType": "string" },
              "hora_fin": { "bsonType": "string" },
              "motivo": { "bsonType": "string" }
            }
          }
        },
        "disponible": { "bsonType": "bool", "default": true }
      }
    }
  },
  "indexes": [
    { "key": { "_id": 1 } },
    { "key": { "cancha_id": 1, "fecha": 1 }, "unique": true },
    { "key": { "fecha": 1 } },
    { "key": { "disponible": 1 } }
  ]
}
```

### **🔔 Colección: `notificaciones`**

```json
{
  "collection": "notificaciones",
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": ["usuario_id", "tipo", "titulo", "mensaje"],
      "properties": {
        "_id": { "bsonType": "objectId" },
        "usuario_id": { "bsonType": "objectId" },
        "tipo": {
          "enum": [
            "reserva_confirmada",
            "recordatorio_24h",
            "cancelacion",
            "calificacion_pendiente"
          ]
        },
        "titulo": { "bsonType": "string", "minLength": 5, "maxLength": 100 },
        "mensaje": { "bsonType": "string", "minLength": 10, "maxLength": 500 },
        "datos_adicionales": {
          "bsonType": "object",
          "properties": {
            "reserva_id": { "bsonType": "objectId" },
            "cancha_nombre": { "bsonType": "string" },
            "fecha": { "bsonType": "date" },
            "hora": { "bsonType": "string" }
          }
        },
        "leida": { "bsonType": "bool", "default": false },
        "fecha_envio": { "bsonType": "date" }
      }
    }
  },
  "indexes": [
    { "key": { "_id": 1 } },
    { "key": { "usuario_id": 1, "leida": 1 } },
    { "key": { "tipo": 1 } },
    { "key": { "fecha_envio": -1 } },
    { "key": { "leida": 1, "fecha_envio": -1 } }
  ]
}
```

## 🔗 RELACIONES FÍSICAS (REFERENCIAS)

```
usuarios._id ←── canchas.propietario_id
usuarios._id ←── reservas.usuario_id
usuarios._id ←── calificaciones.usuario_id
usuarios._id ←── notificaciones.usuario_id

canchas._id ←── reservas.cancha_id
canchas._id ←── calificaciones.cancha_id
canchas._id ←── disponibilidad.cancha_id

reservas._id ←── calificaciones.reserva_id (único)
reservas._id ←── disponibilidad.horarios_ocupados.reserva_id
```

## ⚡ ESTRATEGIAS DE RENDIMIENTO

### **Índices Compuestos Críticos:**

```javascript
// Búsqueda geoespacial con filtros
db.canchas.createIndex({
  coordenadas: "2dsphere",
  activa: 1,
  tipo_cancha: 1,
});

// Consulta de disponibilidad rápida
db.disponibilidad.createIndex(
  {
    cancha_id: 1,
    fecha: 1,
  },
  { unique: true }
);

// Dashboard de usuario
db.reservas.createIndex({
  usuario_id: 1,
  estado: 1,
  fecha: -1,
});

// Notificaciones no leídas
db.notificaciones.createIndex({
  usuario_id: 1,
  leida: 1,
  fecha_envio: -1,
});
```

### **Configuraciones de Sharding (Futuro):**

```javascript
// Shard key por ubicación geográfica
sh.shardCollection("spelplaut.canchas", {
  coordenadas: "hashed",
});

// Shard key por fecha para reservas
sh.shardCollection("spelplaut.reservas", {
  fecha: 1,
  cancha_id: 1,
});
```

## 💾 CONFIGURACIONES DE ALMACENAMIENTO

### **Tamaños Estimados:**

- **usuarios**: ~500 bytes/doc → 50MB (100K usuarios)
- **canchas**: ~2KB/doc → 20MB (10K canchas)
- **reservas**: ~300 bytes/doc → 300MB (1M reservas)
- **calificaciones**: ~200 bytes/doc → 20MB (100K calificaciones)
- **disponibilidad**: ~1KB/doc → 365MB (1K canchas × 365 días)
- **notificaciones**: ~250 bytes/doc → 250MB (1M notificaciones)

### **Configuraciones de TTL:**

```javascript
// Notificaciones se eliminan después de 90 días
db.notificaciones.createIndex(
  { fecha_envio: 1 },
  { expireAfterSeconds: 7776000 }
);

// Disponibilidad de fechas pasadas se elimina después de 30 días
db.disponibilidad.createIndex({ fecha: 1 }, { expireAfterSeconds: 2592000 });
```

## 🔒 SEGURIDAD Y VALIDACIONES

### **Roles de Base de Datos:**

```javascript
// Rol para aplicación web
{
  "role": "spelplautApp",
  "privileges": [
    {
      "resource": { "db": "spelplaut", "collection": "" },
      "actions": ["find", "insert", "update", "remove"]
    }
  ]
}

// Rol solo lectura para reportes
{
  "role": "spelplautReports",
  "privileges": [
    {
      "resource": { "db": "spelplaut", "collection": "" },
      "actions": ["find"]
    }
  ]
}
```

### **Triggers de Validación:**

```javascript
// Trigger para actualizar calificación promedio
db.system.js.save({
  _id: "updateCanchaRating",
  value: function (canchaId) {
    // Recalcular calificación promedio cuando se agrega nueva calificación
  },
});
```

---

**SpelPlaut MongoDB** - Estructura Física Optimizada
Loma Plata, Paraguay 🇵🇾
