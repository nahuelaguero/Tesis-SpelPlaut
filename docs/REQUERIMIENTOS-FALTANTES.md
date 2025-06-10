# 🚧 FUNCIONALIDADES FALTANTES CRÍTICAS

## 🗺️ **MAPA INTERACTIVO - PRIORIDAD ALTA**

### Lo que existe:

- ✅ Geolocalización básica (coordenadas)
- ✅ Links externos a Google Maps
- ✅ Cálculo de distancias

### Lo que falta:

- ❌ **Mapa embebido en la interfaz**
- ❌ **Marcadores de canchas en el mapa**
- ❌ **Vista de mapa en listado de canchas**
- ❌ **Componente MapView.tsx**

### Implementación necesaria:

```bash
# Instalar librería de mapas
npm install leaflet react-leaflet
npm install @types/leaflet -D

# Crear componentes:
# - src/components/maps/MapView.tsx
# - src/components/maps/CanchaMarker.tsx
# - src/components/maps/MapSearch.tsx
```

## 💳 **BANCARD REAL - PRIORIDAD ALTA**

### Lo que existe:

- ✅ Mockup de API endpoints
- ✅ UI de métodos de pago
- ✅ Flow de pago simulado

### Lo que falta:

- ❌ **Credenciales reales de Bancard**
- ❌ **SDK/API real de Bancard**
- ❌ **Webhooks de confirmación**
- ❌ **Manejo de errores reales**

### Implementación necesaria:

```bash
# Variables de entorno necesarias:
BANCARD_PUBLIC_KEY=tu_clave_publica
BANCARD_PRIVATE_KEY=tu_clave_privada
BANCARD_ENVIRONMENT=sandbox|production
BANCARD_WEBHOOK_SECRET=tu_webhook_secret

# Actualizar:
# - src/app/api/pagos/bancard/route.ts
# - src/lib/bancard.ts (nuevo)
```

## 📅 **CALENDARIO DE RESERVAS - CRÍTICO**

### Lo que falta completamente:

- ❌ **Componente CalendarioReservas**
- ❌ **Vista mensual con disponibilidad**
- ❌ **TimeSlotPicker component**
- ❌ **ReservaModal para crear reservas**

## 📊 **DASHBOARD ADMIN - IMPORTANTE**

### Lo que existe:

- ✅ API endpoints con estadísticas
- ✅ Autenticación admin

### Lo que falta:

- ❌ **UI del dashboard admin**
- ❌ **Gráficos interactivos**
- ❌ **Gestión de reservas por admin**

## 🔄 **INTEGRACIÓN FRONTEND-BACKEND**

### APIs implementadas pero sin UI:

- ❌ `GET /api/reservas/disponibilidad` (sin componente)
- ❌ `GET /api/reservas/calendario` (sin vista)
- ❌ `GET /api/reservas/estadisticas` (sin dashboard)
- ❌ `POST /api/reservas/validar` (sin validación en tiempo real)

## 💬 **NOTIFICACIONES EN TIEMPO REAL**

### Lo que falta:

- ❌ **WebSockets o Server-Sent Events**
- ❌ **Push notifications**
- ❌ **Sistema de recordatorios automáticos**

---

## 🎯 **PLAN DE IMPLEMENTACIÓN SUGERIDO:**

### Fase 1 - CRÍTICO (1-2 semanas)

1. **CalendarioReservas** - Permite reservar visualmente
2. **Mapa interactivo** - Mejora experiencia de usuario
3. **Bancard real** - Pagos reales funcionando

### Fase 2 - IMPORTANTE (1 semana)

4. **Dashboard admin** - Gestión completa
5. **Integración APIs existentes** - Conectar backend con frontend

### Fase 3 - MEJORAS (1 semana)

6. **Notificaciones** - Experiencia completa
7. **Sistema de reviews** - Valor agregado
