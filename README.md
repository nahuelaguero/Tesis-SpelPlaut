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

#### 🟡 **Propietario de Cancha** (`propietario_cancha`)

- ❌ **NO puede hacer reservas** (solo gestiona su cancha)
- ✅ **Dashboard exclusivo** con estadísticas de su cancha
- ✅ **Ver todas las reservas** de su cancha únicamente
- ✅ **Análisis de ingresos** y ocupación
- ✅ **Gestión de disponibilidad** de su cancha
- ✅ **Reportes específicos** de su negocio
- 🔍 **Navegación**: Solo "Mi Cancha" + "Perfil"
- 📊 **Datos aislados**: Solo ve información de su cancha asignada

#### 🔴 **Administrador** (`admin`)

- ✅ **Acceso completo** a todas las funcionalidades
- ✅ **Puede hacer reservas** como usuario normal
- ✅ **Panel de administración** completo
- ✅ **Gestión de usuarios** y roles
- ✅ **CRUD de canchas** (crear, editar, eliminar)
- ✅ **Ver TODAS las reservas** del sistema
- ✅ **Reportes globales** y estadísticas
- ✅ **Moderación de contenido**
- 🔍 **Navegación**: Todo disponible + "Administración"

#### 🔒 **Restricciones de Seguridad**

- **Propietarios** solo ven datos de su `cancha_id` asignada
- **APIs protegidas** con validación de roles en cada endpoint
- **Navegación dinámica** según el rol del usuario
- **Redirecciones automáticas** si se intenta acceso no autorizado
- **Aislamiento de datos** entre propietarios

### 🏟️ Gestión de Canchas

- CRUD completo para canchas deportivas
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
- Reportes y estadísticas
- Moderación de contenido

## 🛠️ Tecnologías Utilizadas

### Frontend

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Diseño responsivo
- **Radix UI** - Componentes accesibles
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
│   ├── auth/              # Páginas de autenticación
│   └── ...
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base
│   ├── forms/            # Formularios específicos
│   └── ...
├── lib/                  # Utilidades y configuraciones
├── hooks/                # Custom React hooks
├── types/                # Definiciones TypeScript
└── utils/                # Funciones helper

docs/                     # 📚 Documentación completa
├── GEOLOCATION-SEARCH-SYSTEM.md
├── ANALISIS-DISPONIBILIDAD-CANCHAS.md
└── ...
```

## 📚 Documentación Completa

La documentación detallada se encuentra en la carpeta `docs/`:

### 🏗️ Arquitectura y Diseño

- [`DIAGRAMA-BASE-DATOS.md`](docs/DIAGRAMA-BASE-DATOS.md) - Esquema de base de datos
- [`DIAGRAMA-FISICO-MONGODB.md`](docs/DIAGRAMA-FISICO-MONGODB.md) - Estructura MongoDB
- [`ANALISIS-DISPONIBILIDAD-CANCHAS.md`](docs/ANALISIS-DISPONIBILIDAD-CANCHAS.md) - Lógica de disponibilidad
- [`SISTEMA-ROLES-PERMISOS.md`](docs/SISTEMA-ROLES-PERMISOS.md) - **Sistema de roles y permisos**

### 🌍 Funcionalidades Avanzadas

- [`GEOLOCATION-SEARCH-SYSTEM.md`](docs/GEOLOCATION-SEARCH-SYSTEM.md) - Sistema de geolocalización
- [`README-EMAIL.md`](docs/README-EMAIL.md) - Configuración de emails

### 🔧 Desarrollo y Evaluación

- [`EVALUACION-BACKEND-REAL.md`](docs/EVALUACION-BACKEND-REAL.md) - Análisis del backend
- [`REQUERIMIENTOS-FALTANTES.md`](docs/REQUERIMIENTOS-FALTANTES.md) - Funcionalidades pendientes
- [`HANDOFF-CURSOR-AGENT.md`](docs/HANDOFF-CURSOR-AGENT.md) - Guía para desarrolladores

## 🎯 Estado del Proyecto

### ✅ Completado

- [x] Sistema de autenticación completo
- [x] **Sistema 2FA por email** con códigos de 6 dígitos
- [x] **Sistema de roles y permisos** (usuario, propietario, admin)
- [x] **Dashboard propietario** con estadísticas completas
- [x] **Aislamiento de datos** por rol
- [x] **Navegación dinámica** según permisos
- [x] CRUD de canchas con geolocalización
- [x] Sistema de reservas con calendario
- [x] APIs REST funcionales y protegidas
- [x] Panel de administración completo
- [x] Sistema de emails
- [x] Búsqueda avanzada con filtros
- [x] Validación robusta
- [x] PWA básica
- [x] **Build de producción** optimizado

### 🔄 En Desarrollo

- [ ] Mapas interactivos (Leaflet)
- [ ] Sistema de imágenes real (Cloudinary)
- [ ] Integración completa Bancard
- [ ] Dashboard de analytics avanzado

### 📋 Próximas Funcionalidades

- [ ] Sistema de calificaciones y reviews
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Modo offline completo

## 🔧 Troubleshooting y Configuración

### 🔐 Sistema 2FA (Verificación en Dos Pasos)

#### Configuración de Base de Datos

**⚠️ IMPORTANTE**: La aplicación usa MongoDB Atlas con la siguiente configuración:

```env
MONGODB_URI=mongodb+srv://nahuelaguerosan:CDaHO2t0v8L8Q9Y9@cluster0.nisl1og.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

#### Estructura de Datos

- **Base de datos**: `test` (por defecto en MongoDB Atlas)
- **Colección de usuarios**: `users` (no `usuarios`)
- **Campo 2FA**: `autenticacion_2FA: boolean`

#### Verificar Estado 2FA

Para verificar si un usuario tiene 2FA activado, usa este script:

```javascript
// check-user-2fa.js
const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://nahuelaguerosan:CDaHO2t0v8L8Q9Y9@cluster0.nisl1og.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function checkUser() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("test");
    const user = await db.collection("users").findOne({
      email: "tu-email@gmail.com",
    });

    console.log("2FA activado:", user?.autenticacion_2FA);
    console.log("Rol:", user?.rol);
  } finally {
    await client.close();
  }
}

checkUser();
```

#### Flujo 2FA Completo

1. **Activación**:

   - Usuario va a Perfil → Seguridad
   - Activa el switch de 2FA
   - Sistema envía código por email
   - Usuario ingresa código para confirmar

2. **Login con 2FA**:

   - Usuario ingresa email/contraseña
   - Si tiene 2FA activado, se solicita código
   - Sistema envía código por email
   - Usuario ingresa código para completar login

3. **Códigos 2FA**:
   - 6 dígitos numéricos
   - Expiran en 10 minutos
   - Se muestran en consola del servidor (modo desarrollo)
   - Se guardan en `dev-emails.log`

#### Problemas Comunes

**❌ "Usuario no encontrado" en login**

- Verificar que estés usando la base de datos correcta (`test`)
- Verificar que la colección sea `users` no `usuarios`

**❌ "2FA no se muestra como activado"**

- El estado se guarda correctamente en BD pero puede haber delay en UI
- Refrescar la página o cerrar/abrir sesión

**❌ "No recibo códigos 2FA"**

- En desarrollo, los códigos aparecen en:
  - Consola del servidor
  - Archivo `dev-emails.log`
- En producción, configurar SMTP real

### 📧 Configuración de Email

#### Modo Desarrollo (MOCK)

```env
EMAIL_SERVICE=mock
```

- Los emails se guardan en `dev-emails.log`
- Los códigos 2FA aparecen en consola

#### Modo Producción

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### 🗄️ Base de Datos

#### Conexión MongoDB Atlas

- Usar la URI completa con credenciales
- Base de datos por defecto: `test`
- Colecciones principales: `users`, `canchas`, `reservas`

#### Verificar Conexión

```bash
# Instalar MongoDB Compass
# Conectar con la URI del .env.local
# Verificar que existan las colecciones
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Nahuel Aguero** - _Desarrollo inicial_

## 🙏 Agradecimientos

- Comunidad de Next.js por el excelente framework
- OpenStreetMap por los servicios de geocodificación gratuitos
- Vercel por el hosting y deployment simplificado
- MongoDB por la excelente base de datos NoSQL

---

**Nota**: Este proyecto está optimizado para Paraguay pero puede adaptarse fácilmente a otros países modificando las validaciones geográficas y el sistema de pagos.
