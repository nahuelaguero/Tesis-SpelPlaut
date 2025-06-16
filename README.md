# 🏟️ Spelplaut - Sistema de Reserva de Canchas

Una aplicación web moderna y completa para la gestión y reserva de canchas deportivas en Paraguay, construida con Next.js 14, TypeScript y MongoDB.

## 🚀 Características Principales

### 🔐 Sistema de Autenticación

- Registro y login seguro con JWT
- **Verificación en dos pasos (2FA)** por email
- Gestión de perfiles de usuario
- Recuperación de contraseñas por email
- Diferentes roles (usuario, propietario, admin)
- Protección de endpoints críticos con 2FA

### 👥 Sistema de Roles y Permisos

El sistema implementa **3 roles principales** con permisos específicos:

#### 🟢 **Usuario Normal** (`usuario`)

- ✅ **Puede hacer reservas** en cualquier cancha disponible
- ✅ **Ver sus propias reservas** en "Mis Reservas"
- ✅ **Buscar y filtrar canchas** por ubicación, tipo, precio
- ✅ **Gestionar su perfil** y configuración 2FA
- ✅ **Procesar pagos** para sus reservas
- ✅ **Recibir notificaciones** por email
- 🔍 **Navegación**: "Canchas" + "Mis Reservas" + "Perfil"

#### 🟡 **Propietario de Cancha** (`propietario_cancha`) - **SOPORTE MULTI-CANCHA** 🆕

- ❌ **NO puede hacer reservas** (solo gestiona sus canchas)
- ✅ **Dashboard exclusivo** con estadísticas consolidadas y por cancha
- ✅ **Gestión de múltiples canchas** - Un propietario puede tener varias canchas
- ✅ **Selector de cancha** para ver estadísticas específicas o consolidadas
- ✅ **Ver todas las reservas** de sus canchas únicamente
- ✅ **Análisis de ingresos** y ocupación por cancha o consolidado
- ✅ **Gestión de disponibilidad** de todas sus canchas
- ✅ **Reportes específicos** de su negocio multi-cancha
- 🔍 **Navegación**: Solo "Mi Dashboard" + "Perfil"
- 📊 **Datos aislados**: Solo ve información de sus canchas asignadas
- 🏢 **Escalabilidad empresarial**: Soporte para crecimiento del negocio

#### 🔴 **Administrador** (`admin`)

- ✅ **Acceso completo** a todas las funcionalidades
- ✅ **Puede hacer reservas** como usuario normal
- ✅ **Panel de administración** completo
- ✅ **Gestión de usuarios** y roles
- ✅ **CRUD de canchas** (crear, editar, eliminar)
- ✅ **Asignación de múltiples canchas** a propietarios
- ✅ **Ver TODAS las reservas** del sistema
- ✅ **Reportes globales** y estadísticas
- ✅ **Moderación de contenido**
- 🔍 **Navegación**: Todo disponible + "Administración"

#### 🔒 **Restricciones de Seguridad**

- **Propietarios** solo ven datos de sus canchas asignadas (`propietario_id`)
- **APIs protegidas** con validación de roles en cada endpoint
- **Navegación dinámica** según el rol del usuario
- **Redirecciones automáticas** si se intenta acceso no autorizado
- **Aislamiento de datos** entre propietarios
- **Arquitectura 1:N** - Un propietario puede tener múltiples canchas

### 🏟️ Gestión de Canchas - **ARQUITECTURA MULTI-CANCHA** 🆕

- **CRUD completo** para canchas deportivas
- **Soporte multi-cancha por propietario** - Arquitectura escalable 1:N
- **Dashboard consolidado** con estadísticas de todas las canchas del propietario
- **Vista específica por cancha** con estadísticas individuales
- **Selector inteligente** para alternar entre vista consolidada y específica
- Soporte para múltiples tipos (fútbol, futsal, básquet, tenis, pádel, vóleibol)
- Sistema de imágenes con drag & drop
- Gestión de horarios y disponibilidad
- Geolocalización inteligente

### 📍 Sistema de Geolocalización Avanzado

- **Búsqueda por ubicación** con GPS automático
- **Filtros inteligentes** por proximidad, precio, tipo
- **Geocodificación** usando OpenStreetMap Nominatim
- **Validación automática** de ubicaciones en Paraguay
- **Búsqueda avanzada** con múltiples criterios

### 📅 Reservas Inteligentes

- Calendario interactivo integrado
- **Campo `duracion_horas`** con validación (0.5-24 horas)
- Validación de disponibilidad en tiempo real
- Sistema de reservas con confirmación
- Gestión de horarios flexibles
- Notificaciones por email

### 💳 Sistema de Pagos

- Integración con Bancard (Paraguay)
- Procesamiento seguro de pagos
- Confirmación automática de reservas

### 📊 Panel de Administración

- Dashboard completo para administradores
- Gestión de usuarios y canchas
- **Asignación de múltiples canchas** a propietarios
- Reportes y estadísticas
- Moderación de contenido

## 🛠️ Tecnologías Utilizadas

### Frontend

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Diseño responsivo
- **Radix UI** - Componentes accesibles (`@radix-ui/react-select`, `@radix-ui/react-switch`)
- **React Hook Form** - Manejo de formularios

### Backend

- **Next.js API Routes** - API REST completa
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación segura
- **bcrypt** - Hashing de contraseñas

### Servicios Externos

- **OpenStreetMap Nominatim** - Geocodificación
- **Nodemailer** - Envío de emails
- **Bancard API** - Procesamiento de pagos

## 📱 Características PWA

- ✅ **Installable** - Se puede instalar como app nativa
- ✅ **Responsive** - Funciona en todos los dispositivos
- ✅ **Offline-ready** - Funcionalidad básica sin conexión
- ✅ **Fast Loading** - Optimizado para velocidad

## 🚀 Inicio Rápido

### Prerrequisitos

```bash
node >= 18.0.0
pnpm >= 8.0.0
MongoDB >= 6.0.0
```

### Instalación

```bash
# Clonar el repositorio
git clone [repository-url]
cd reserva-cancha-app

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# Ejecutar en desarrollo
pnpm dev
```

### Variables de Entorno Requeridas

```env
# Base de datos
MONGODB_URI=mongodb+srv://nahuelaguerosan:CDaHO2t0v8L8Q9Y9@cluster0.nisl1og.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=tu-secreto-jwt-super-seguro

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Bancard (Producción)
BANCARD_PRIVATE_KEY=tu-private-key
BANCARD_PUBLIC_KEY=tu-public-key
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── admin/             # Panel de administración
│   ├── api/               # API Routes
│   │   ├── propietario/   # 🆕 APIs específicas para propietarios multi-cancha
│   │   └── reservas/      # APIs de reservas con soporte multi-cancha
│   ├── mi-cancha/         # 🆕 Dashboard multi-cancha para propietarios
│   └── ...
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Select, Switch con Radix UI)
│   ├── forms/            # Formularios específicos
│   └── ...
├── lib/                  # Utilidades y configuraciones
├── hooks/                # Custom React hooks
├── types/                # 🆕 Definiciones TypeScript actualizadas (PropietarioDashboard)
└── utils/                # Funciones helper

docs/                     # 📚 Documentación completa
├── GEOLOCATION-SEARCH-SYSTEM.md
├── ANALISIS-DISPONIBILIDAD-CANCHAS.md
└── ...
```

## 🆕 Nuevas Funcionalidades - Soporte Multi-Cancha

### 🏢 Arquitectura Empresarial

- **Relación 1:N** - Un propietario puede gestionar múltiples canchas
- **Dashboard consolidado** con estadísticas de todas las canchas
- **Vista específica** por cancha seleccionada
- **Escalabilidad** para crecimiento del negocio

### 📊 Dashboard Propietario Mejorado

- **Selector de cancha** con opciones:
  - 📊 Vista Consolidada (todas las canchas)
  - 🏟️ Vista específica por cancha
- **Estadísticas consolidadas**:
  - Total de canchas
  - Reservas y ingresos combinados
  - Ocupación promedio general
- **Estadísticas por cancha**:
  - Métricas específicas de la cancha seleccionada
  - Comparación de rendimiento

### 🔧 Mejoras Técnicas

- **Modelo de datos actualizado**:
  - Eliminado `cancha_id` del modelo Usuario
  - Mantenido `propietario_id` en modelo Cancha
  - Agregado `duracion_horas` al modelo Reserva
- **APIs optimizadas**:
  - `/api/propietario/dashboard` con soporte query `?cancha_id=xxx`
  - Consultas MongoDB optimizadas para múltiples canchas
- **Componentes UI mejorados**:
  - Componente Select con Radix UI
  - Interfaz intuitiva para gestión multi-cancha

## 🧪 Testing y Calidad

- ✅ **ESLint** configurado con reglas estrictas
- ✅ **TypeScript** sin tipos `any`
- ✅ **Código limpio** sin imports no utilizados
- ✅ **Arquitectura escalable** para crecimiento empresarial

## 📈 Roadmap

- [ ] **Mapa real** con Leaflet
- [ ] **Sistema de imágenes** con Cloudinary/S3
- [ ] **Integración real** con Bancard
- [ ] **Dashboard admin** UI completo
- [ ] **Notificaciones push** PWA
- [ ] **Analytics avanzados** por cancha

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Nahuel Agüero**

- Email: nahuel.aguerosan@gmail.com
- GitHub: [@nahuelaguero]

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐

## 🚀 Scripts de Desarrollo

### Scripts Principales

```bash
# Desarrollo rápido (recomendado para desarrollo diario)
pnpm run dev

# Desarrollo con checks de lint y tipos (sin build)
pnpm run dev:check

# Desarrollo con checks completos (lint + type-check + build + dev)
pnpm run dev:full

# Build de producción
pnpm run build

# Build con checks previos
pnpm run build:check
```

### Scripts de Calidad de Código

```bash
# Linter
pnpm run lint          # Verificar errores de lint
pnpm run lint:fix      # Corregir errores de lint automáticamente

# Type checking
pnpm run type-check    # Verificar tipos de TypeScript

# Datos de prueba
pnpm run seed          # Poblar base de datos con datos de prueba
```

## 🔧 Git Hooks (Calidad de Código Automática)

El proyecto tiene configurados **Git Hooks** que se ejecutan automáticamente:

### Pre-commit Hook

Se ejecuta **antes de cada commit**:

- ✅ Ejecuta `lint-staged` (lint + prettier en archivos modificados)
- ✅ Formatea código automáticamente

### Pre-push Hook

Se ejecuta **antes de cada push**:

- ✅ Ejecuta `pnpm run lint` (verifica todo el proyecto)
- ✅ Ejecuta `pnpm run type-check` (verifica tipos)
- ✅ Ejecuta `pnpm run build` (verifica que compile)
- ❌ **Bloquea el push si algún check falla**

### Flujo de Trabajo Recomendado

```bash
# 1. Desarrollo rápido
pnpm run dev

# 2. Hacer cambios y commit (lint automático en archivos modificados)
git add .
git commit -m "feat: nueva funcionalidad"

# 3. Push (verificación completa automática)
git push origin main
```

### Beneficios

- 🛡️ **Previene bugs** antes de llegar al repositorio
- 🧹 **Mantiene código limpio** automáticamente
- 🚀 **Asegura que el proyecto compile** antes de push
- 👥 **Consistencia en el equipo** sin esfuerzo manual
- ⚡ **Desarrollo rápido** sin checks innecesarios

## 🏗️ Arquitectura
