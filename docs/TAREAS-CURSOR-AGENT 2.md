# 🚀 TAREAS PARA CURSOR AGENT

## 📊 **SITUACIÓN ACTUAL**

- ✅ **Backend 95% completo** (32 endpoints funcionando)
- ✅ **Servidor corriendo** en `localhost:3001`
- ❌ **Frontend incompleto** (faltan 4 componentes críticos)

---

## 🎯 **TAREAS PRIORITARIAS**

### **1. CALENDARIO DE RESERVAS** ⭐ **CRÍTICO**

```typescript
// ARCHIVO: src/components/reservas/CalendarioReservas.tsx
// API LISTA: GET /api/reservas/disponibilidad
// OBJETIVO: Vista mensual clickeable para crear reservas

interface CalendarioReservasProps {
  canchaId: string;
  onReservaCreated: (reserva: any) => void;
}

// Features requeridas:
// - Vista mensual con slots disponibles/ocupados
// - Click en slot abre modal de reserva
// - Estados: disponible, ocupado, bloqueado
// - Loading states y error handling
```

### **2. MAPA INTERACTIVO** ⭐ **ALTA PRIORIDAD**

```bash
# PASO 1: Instalar dependencias
pnpm add leaflet react-leaflet @types/leaflet

# PASO 2: Crear componente
# ARCHIVO: src/components/maps/MapView.tsx
```

```typescript
// OBJETIVO: Mapa embebido con marcadores
interface MapViewProps {
  canchas: Cancha[];
  userLocation?: Coordinates;
  onCanchaSelect: (cancha: Cancha) => void;
}

// Features requeridas:
// - Leaflet map con marcadores
// - Popup con info de cancha
// - Centrado en ubicación del usuario
// - Integrar con geolocalización existente
```

### **3. DASHBOARD ADMIN** ⭐ **MEDIA PRIORIDAD**

```typescript
// ARCHIVO: src/app/admin/dashboard/page.tsx
// API LISTA: GET /api/reservas/estadisticas

// OBJETIVO: Dashboard con métricas y gestión
// Features requeridas:
// - Gráficos de estadísticas (recharts)
// - Tabla de reservas administrables
// - Filtros por fecha/estado
// - Acciones rápidas (confirmar/cancelar)
```

### **4. BANCARD REAL** ⭐ **BAJA PRIORIDAD**

```typescript
// ARCHIVO: src/lib/bancard.ts
// OBJETIVO: Conectar con API real de Bancard

// Variables de entorno necesarias:
BANCARD_PUBLIC_KEY = BANCARD_PRIVATE_KEY = BANCARD_ENVIRONMENT = sandbox;

// NOTA: El mockup actual funciona perfectamente
// Esta tarea puede postponerse
```

---

## 🔧 **COMANDOS ÚTILES**

```bash
# Desarrollo
pnpm dev

# Instalar dependencias de mapa
pnpm add leaflet react-leaflet @types/leaflet

# Instalar para gráficos
pnpm add recharts date-fns

# Build y verificar
pnpm build
```

---

## 🏗️ **ARQUITECTURA ESTABLECIDA**

### **Stack:**

- Next.js 14 + TypeScript + Tailwind CSS
- Radix UI + Lucide Icons
- MongoDB + Mongoose

### **Patrones a seguir:**

- `ApiResponse<T>` para todas las respuestas
- Loading states con `LoadingSpinner`
- Validación con `/src/lib/validation.ts`
- Textos UI en español, código en inglés
- Componentes máximo 50 líneas
- NO usar `any()`

### **APIs disponibles:**

```
GET /api/reservas/disponibilidad?cancha_id={id}&fecha={fecha}
GET /api/reservas/calendario?cancha_id={id}&mes={mes}&ano={ano}
GET /api/reservas/estadisticas?admin=true
POST /api/reservas/validar
POST /api/reservas
```

---

## ⚡ **EMPEZAR AQUÍ**

**PRIMERA TAREA:** Crear `CalendarioReservas` component

**RAZÓN:** Es lo más crítico para que usuarios puedan reservar. El backend tiene toda la lógica lista.

**UBICACIÓN:** `src/components/reservas/CalendarioReservas.tsx`

**API ENDPOINT:** `GET /api/reservas/disponibilidad`

---

## 🎯 **OBJETIVO FINAL**

Completar los 4 componentes faltantes para tener una aplicación 100% funcional:

1. ✅ Backend robusto (COMPLETO)
2. ❌ Calendario visual (FALTA)
3. ❌ Mapa interactivo (FALTA)
4. ❌ Dashboard admin (FALTA)
5. ❌ Bancard real (OPCIONAL)

**Una vez completado:** App lista para producción.
