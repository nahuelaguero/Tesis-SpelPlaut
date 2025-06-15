# 🏟️ Spelplaut - Sistema de Reserva de Canchas

Una aplicación web moderna y completa para la gestión y reserva de canchas deportivas en Paraguay, construida con Next.js 14, TypeScript y MongoDB.

## 🚀 Características Principales

### 🔐 Sistema de Autenticación

- Registro y login seguro con JWT
- Gestión de perfiles de usuario
- Recuperación de contraseñas por email
- Diferentes roles (usuario, propietario, admin)

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
MONGODB_URI=mongodb://localhost:27017/spelplaut

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
- [x] CRUD de canchas con geolocalización
- [x] Sistema de reservas con calendario
- [x] APIs REST funcionales
- [x] Panel de administración
- [x] Sistema de emails
- [x] Búsqueda avanzada con filtros
- [x] Validación robusta
- [x] PWA básica

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
