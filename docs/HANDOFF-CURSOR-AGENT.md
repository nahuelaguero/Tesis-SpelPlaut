# 🚀 HANDOFF PARA CURSOR AGENT - RESERVA CANCHAS APP

## 📊 **ESTADO ACTUAL DEL PROYECTO**

### ✅ **LO QUE ESTÁ COMPLETAMENTE IMPLEMENTADO:**

#### 🔐 **Sistema de Autenticación (100% COMPLETO)**

- JWT con refresh tokens automáticos
- Rate limiting y seguridad robusta
- Roles: `usuario`, `admin`
- Middleware de autenticación en `/src/lib/auth.ts`
- Context: `/src/contexts/AuthContext.tsx`

#### 📧 **Sistema de Emails (100% COMPLETO)**

- Templates profesionales en `/src/lib/email.ts`
- Confirmación de reservas, recordatorios, cancelaciones
- Configurado con Nodemailer + Gmail

#### 🏟️ **CRUD de Canchas (100% COMPLETO)**

- API completa en `/src/app/api/canchas/`
- Validación robusta con `/src/lib/validation.ts`
- UI admin para gestión en `/src/app/admin/canchas/`

#### 🌍 **Geolocalización (100% COMPLETO)**

- Hook `useGeolocation` en `/src/lib/geolocation.ts`
- API Nominatim para geocoding/reverse geocoding
- Cálculo de distancias con fórmula Haversine
- Componente SearchFilters con filtros avanzados

#### 🎯 **APIs de Reservas (100% COMPLETO)**

- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/disponibilidad` - Slots disponibles
- `GET /api/reservas/calendario` - Vista mensual
- `GET /api/reservas/estadisticas` - Dashboard metrics
- `POST /api/reservas/validar` - Validación previa

#### 💸 **Base de Pagos (MOCKUP COMPLETO)**

- API `/api/pagos/bancard/` simulada
- Componente `PaymentMethods.tsx` funcional
- Flow de pago hasta confirmación

### ⚠️ **LO QUE ESTÁ INCOMPLETO:**

#### 🗺️ **MAPA INTERACTIVO - CRÍTICO FALTANTE**

```bash
# NECESITA:
npm install leaflet react-leaflet @types/leaflet

# CREAR:
src/components/maps/MapView.tsx
src/components/maps/CanchaMarker.tsx
src/components/maps/MapContainer.tsx
```

#### 💳 **BANCARD REAL - CRÍTICO FALTANTE**

```bash
# Variables de entorno necesarias:
BANCARD_PUBLIC_KEY=
BANCARD_PRIVATE_KEY=
BANCARD_ENVIRONMENT=sandbox
```

#### 📅 **CALENDARIO DE RESERVAS - CRÍTICO FALTANTE**

```bash
# CREAR COMPONENTES:
src/components/reservas/CalendarioReservas.tsx
src/components/reservas/TimeSlotPicker.tsx
src/components/reservas/ReservaModal.tsx
```

#### 📊 **DASHBOARD ADMIN UI - IMPORTANTE FALTANTE**

```bash
# CREAR:
src/app/admin/dashboard/page.tsx
src/components/admin/EstadisticasChart.tsx
src/components/admin/ReservasTable.tsx
```

---

## 🎯 **TAREAS PRIORITARIAS PARA CURSOR AGENT**

### **1. CALENDARIO DE RESERVAS (MÁXIMA PRIORIDAD)**

**Objetivo:** Componente visual para ver disponibilidad y crear reservas

**APIs ya listas:**

- `GET /api/reservas/disponibilidad` ✅
- `POST /api/reservas/validar` ✅
- `POST /api/reservas` ✅

**Crear:**

```typescript
// src/components/reservas/CalendarioReservas.tsx
interface CalendarioReservasProps {
  canchaId: string;
  onReservaCreated: (reserva: any) => void;
}

// Features necesarias:
// - Vista mensual con slots disponibles/ocupados
// - Click en slot abre ReservaModal
// - Integración con APIs existentes
// - Loading states y error handling
```

### **2. MAPA INTERACTIVO (ALTA PRIORIDAD)**

**Objetivo:** Mapa embebido con marcadores de canchas

```typescript
// src/components/maps/MapView.tsx
interface MapViewProps {
  canchas: Cancha[];
  userLocation?: Coordinates;
  onCanchaSelect: (cancha: Cancha) => void;
}

// Features necesarias:
// - Leaflet map con marcadores
// - Popup con info de cancha
// - Centrado en ubicación del usuario
// - Filtros por distancia
```

### **3. BANCARD REAL (ALTA PRIORIDAD)**

**Objetivo:** Conectar con API real de Bancard Paraguay

```typescript
// src/lib/bancard.ts
// Implementar SDK real de Bancard
// Manejar webhooks de confirmación
// Procesar pagos reales (no mock)
```

### **4. DASHBOARD ADMIN (MEDIA PRIORIDAD)**

**Objetivo:** UI para estadísticas y gestión

```typescript
// src/app/admin/dashboard/page.tsx
// Consumir GET /api/reservas/estadisticas
// Gráficos con recharts o similar
// Tabla de reservas administrables
```

---

## 🏗️ **ARQUITECTURA Y CONVENCIONES**

### **Stack Tecnológico:**

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, MongoDB con Mongoose
- **Auth:** JWT + HTTP-only cookies
- **Email:** Nodemailer + Gmail
- **Geolocation:** Nominatim API
- **UI:** Radix UI + Lucide Icons

### **Estructura de Carpetas:**

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes reutilizables
├── lib/                # Utilidades y configuraciones
├── models/             # Modelos de MongoDB
├── contexts/           # React Contexts
└── types/              # Definiciones TypeScript
```

### **Reglas de Desarrollo (CRÍTICAS):**

- ✅ **Textos UI en español**, código en inglés
- ✅ **NO usar `any`** - TypeScript estricto
- ✅ **Colocation principle** - si se usa en un lugar, va en ese lugar
- ✅ **Componentes máximo 50 líneas** sin justificación
- ✅ **Validación defensiva** siempre
- ✅ **SOLO Bancard** para pagos (nunca Stripe)

### **Patrones Establecidos:**

- `ApiResponse` interface para todas las respuestas
- `requireAuth()` middleware para rutas protegidas
- Validación con `/src/lib/validation.ts`
- Loading states con `LoadingSpinner`
- Error handling consistente

---

## 🔧 **COMANDOS ÚTILES PARA CURSOR AGENT**

```bash
# Instalar dependencias de mapa
pnpm add leaflet react-leaflet @types/leaflet

# Instalar para gráficos
pnpm add recharts date-fns

# Desarrollo
pnpm dev

# Build y verificar
pnpm build

# Linting
pnpm lint
```

---

## 🎯 **OBJETIVOS ESPECÍFICOS DEL SPRINT**

### **Sprint Goal:** Completar funcionalidades core faltantes

### **Definition of Done:**

1. ✅ CalendarioReservas funcional y conectado a APIs
2. ✅ Mapa interactivo mostrando canchas con marcadores
3. ✅ Sistema de pagos real con Bancard (al menos sandbox)
4. ✅ Dashboard admin básico con estadísticas

### **Criterios de Aceptación:**

- Usuario puede ver disponibilidad en calendario visual
- Usuario puede crear reserva desde calendario
- Mapa muestra canchas cercanas con popups informativos
- Admin puede ver métricas en dashboard visual
- Pagos procesan con Bancard real (sandbox mode)

---

## 📞 **INFORMACIÓN DE CONTEXTO CRÍTICA**

### **Base de Datos:**

- MongoDB con modelos en `/src/models/`
- Usuario, Cancha, Reserva principales
- Relaciones establecidas y populadas

### **Autenticación:**

- Token en cookie `auth-token`
- Verificación con `requireAuth(request)`
- Contexto global en `AuthContext`

### **APIs Key:**

- Todas devuelven `ApiResponse<T>` format
- Error handling estandarizado
- Validación con schemas predefinidos

### **Estado de Dependencias:**

- Next.js 14.2.5 ✅
- Mongoose 8.5.2 ✅
- Tailwind + Radix UI ✅
- Todas las deps sincronizadas en pnpm-lock.yaml ✅

**🚨 IMPORTANTE:** El proyecto tiene base sólida, solo faltan las UI components críticas para completar la experiencia de usuario. Todo el backend está preparado y funcionando.
