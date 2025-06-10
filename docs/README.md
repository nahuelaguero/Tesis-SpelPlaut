# 🏟️ SpelPlaut - App de Reservas Deportivas en Loma Plata

**SpelPlaut** es la app móvil PWA para reservar canchas deportivas en Loma Plata. El nombre combina:

- **Spel** (jugar/juego en Plautdietsch)
- **Plaut** (de Plautdietsch, nuestro dialecto menonita)

Una aplicación **mobile-first** construida con Next.js 14, TypeScript, Tailwind CSS y MongoDB, diseñada especialmente para la comunidad de Loma Plata.

## 🚀 Características

- **📱 Mobile-First**: Diseñado específicamente para dispositivos móviles
- **🏠 PWA (Progressive Web App)**: Instalable como app nativa
- **🔐 Autenticación completa**: Registro, login y logout con JWT
- **🏟️ Gestión de canchas**: CRUD completo para administradores
- **📅 Sistema de reservas**: Reserva en tiempo real con validaciones
- **💳 Pagos integrados**: Efectivo, transferencia y tarjeta
- **👨‍💼 Dashboard administrativo**: Panel completo mobile y web
- **🌟 Branding local**: Diseñado con orgullo para Loma Plata
- **🔔 Notificaciones**: Sistema de recordatorios de reservas
- **🎾 Deportes múltiples**: Fútbol, tenis, básquet, pádel, vóley

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Base de datos**: MongoDB con Mongoose
- **Autenticación**: JWT con cookies HTTP-only
- **PWA**: next-pwa
- **Icons**: Lucide React

## 📋 Requisitos previos

- Node.js 18+
- MongoDB (local o MongoDB Atlas)
- npm o yarn

## 🔧 Instalación

1. **Clona el repositorio**

   ```bash
   git clone <tu-repositorio>
   cd reserva-cancha-app
   ```

2. **Instala las dependencias**

   ```bash
   npm install
   ```

3. **Configura las variables de entorno**

   Crea un archivo `.env.local` en la raíz del proyecto:

   ```env
   MONGODB_URI=mongodb://localhost:27017/spelplaut
   NEXTAUTH_SECRET=tu_secreto_super_secreto_para_jwt_aqui
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Inicia MongoDB**

   Si usas MongoDB local:

   ```bash
   # macOS con Homebrew
   brew services start mongodb/brew/mongodb-community

   # O manualmente
   mongod
   ```

5. **Pobla la base de datos con datos de prueba**

   ```bash
   npm run seed
   ```

6. **Inicia el servidor de desarrollo**

```bash
npm run dev
```

7. **Accede a la aplicación**

   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 👥 Usuarios de Prueba

Después de ejecutar `npm run seed`, tendrás estos usuarios disponibles:

- **Administrador**: `admin@lomaplata.com` / `admin123`
- **Usuario 1**: `juan.perez@lomaplata.com` / `user123`
- **Usuario 2**: `maria.lopez@lomaplata.com` / `user123`

## 🏟️ Canchas de Prueba

La base de datos incluye 6 canchas de ejemplo:

1. **Fútbol 11** - Estadio Municipal (150.000 Gs/hora)
2. **Fútbol 5** - Centro Deportivo (80.000 Gs/hora)
3. **Tenis** - Club Fernheim (60.000 Gs/hora)
4. **Básquet** - Polideportivo Municipal (100.000 Gs/hora)
5. **Pádel** - Centro Recreativo (90.000 Gs/hora)
6. **Vóley** - Complejo Deportivo (70.000 Gs/hora)

## 📱 Instalación como PWA

1. Abre la aplicación en tu navegador móvil
2. En el menú del navegador, selecciona "Añadir a pantalla de inicio"
3. La app se instalará como una aplicación nativa

## 🗂️ Estructura del proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   │   ├── auth/          # Endpoints de autenticación
│   │   ├── canchas/       # Endpoints de canchas
│   │   ├── reservas/      # Endpoints de reservas
│   │   └── pagos/         # Endpoints de pagos
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   └── layout.tsx         # Layout principal
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI reutilizables
│   ├── layout/           # Componentes de layout
│   └── forms/            # Componentes de formularios
├── lib/                  # Utilidades y configuración
│   ├── mongodb.ts        # Configuración de MongoDB
│   ├── auth.ts          # Utilidades de autenticación
│   └── utils.ts         # Utilidades generales
├── models/              # Modelos de Mongoose
│   ├── Usuario.ts       # Modelo de usuario
│   ├── Cancha.ts        # Modelo de cancha
│   └── Reserva.ts       # Modelo de reserva
└── types/               # Tipos de TypeScript
    └── index.ts         # Tipos principales
```

## 🔐 Autenticación

La aplicación utiliza JWT con cookies HTTP-only para la autenticación:

- **Registro**: Crea una nueva cuenta de usuario
- **Login**: Autenticación con email y contraseña
- **Roles**: Usuario normal y administrador
- **Protección**: Rutas protegidas según el rol

## 🏟️ Funcionalidades principales

### Para usuarios:

- Explorar canchas disponibles
- Reservar canchas por fecha y hora
- Gestionar sus reservas
- Realizar pagos online o presencial
- Recibir notificaciones de recordatorio

### Para administradores:

- Gestionar canchas (crear, editar, eliminar)
- Ver todas las reservas
- Gestionar precios y disponibilidad
- Generar reportes de ocupación
- Administrar usuarios

## 🚀 Scripts disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run start`: Inicia el servidor de producción
- `npm run lint`: Ejecuta ESLint
- `npm run seed`: Pobla la base de datos con datos de prueba

## 🌐 Base de datos

### Colecciones principales:

1. **usuarios**: Información de usuarios y administradores
2. **canchas**: Datos de las canchas disponibles
3. **reservas**: Reservas realizadas por usuarios
4. **pagos**: Información de pagos procesados
5. **feedback**: Comentarios y sugerencias

## 📱 API Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión

### Canchas

- `GET /api/canchas` - Obtener todas las canchas
- `POST /api/canchas` - Crear nueva cancha (admin)
- `PUT /api/canchas/[id]` - Actualizar cancha (admin)
- `DELETE /api/canchas/[id]` - Eliminar cancha (admin)

### Reservas

- `GET /api/reservas` - Obtener reservas del usuario
- `POST /api/reservas` - Crear nueva reserva
- `PUT /api/reservas/[id]` - Actualizar reserva
- `DELETE /api/reservas/[id]` - Cancelar reserva

## 🔒 Seguridad

- Contraseñas hasheadas con bcryptjs
- Tokens JWT firmados
- Cookies HTTP-only para tokens
- Validación de entrada en todos los endpoints
- Protección CSRF mediante SameSite cookies

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente

### Docker

```bash
# Construir imagen
docker build -t reserva-cancha-app .

# Ejecutar contenedor
docker run -p 3000:3000 reserva-cancha-app
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o problemas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue si es necesario

## 🗺️ Roadmap

- [ ] Integración con pasarelas de pago reales
- [ ] Sistema de notificaciones push
- [ ] Chat en tiempo real
- [ ] Integración con mapas
- [ ] Sistema de calificaciones
- [ ] API para aplicaciones móviles nativas

---

Desarrollado con ❤️ para facilitar la reserva de canchas deportivas en Paraguay.
