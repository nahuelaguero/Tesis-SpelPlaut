// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/reserva-cancha-app";

const usuarioSchema = new mongoose.Schema(
  {
    nombre_completo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    telefono: { type: String, required: true },
    fecha_nacimiento: { type: Date },
    rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
    estado: { type: String, enum: ["activo", "suspendido"], default: "activo" },
    preferencias: {
      notificaciones_email: { type: Boolean, default: true },
      notificaciones_sms: { type: Boolean, default: false },
      deportes_favoritos: [String],
    },
    verificacion_2fa: {
      habilitado: { type: Boolean, default: false },
      codigo_secreto: String,
    },
  },
  {
    timestamps: true,
  }
);

const canchaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    tipo: { type: String, required: true },
    ubicacion: {
      direccion: { type: String, required: true },
      ciudad: { type: String, required: true },
      coordenadas: {
        latitud: Number,
        longitud: Number,
      },
    },
    imagenes: [String],
    precio_hora: { type: Number, required: true },
    horarios_disponibles: [
      {
        dia: { type: String, required: true },
        desde: { type: String, required: true },
        hasta: { type: String, required: true },
      },
    ],
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
  },
  {
    timestamps: true,
  }
);

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a MongoDB");

    const Usuario = mongoose.model("Usuario", usuarioSchema);
    const Cancha = mongoose.model("Cancha", canchaSchema);

    // Limpiar datos existentes
    await Usuario.deleteMany({});
    await Cancha.deleteMany({});
    console.log("Datos anteriores eliminados");

    // Crear usuarios de ejemplo
    const usuarios = [
      {
        nombre_completo: "Administrador Sistema",
        email: "admin@lomaplata.com",
        password:
          "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmQ1Q9Z9Z9Z9Z9Z", // password: admin123
        telefono: "+595975123456",
        fecha_nacimiento: new Date("1985-05-15"),
        rol: "admin",
        estado: "activo",
        preferencias: {
          notificaciones_email: true,
          notificaciones_sms: true,
          deportes_favoritos: ["futbol", "tenis", "basquet"],
        },
      },
      {
        nombre_completo: "Juan Carlos Pérez",
        email: "juan.perez@lomaplata.com",
        password:
          "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmQ1Q9Z9Z9Z9Z9Z", // password: user123
        telefono: "+595981234567",
        fecha_nacimiento: new Date("1990-03-20"),
        rol: "usuario",
        estado: "activo",
        preferencias: {
          notificaciones_email: true,
          notificaciones_sms: false,
          deportes_favoritos: ["futbol"],
        },
      },
      {
        nombre_completo: "María Fernanda López",
        email: "maria.lopez@lomaplata.com",
        password:
          "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewmQ1Q9Z9Z9Z9Z9Z", // password: user123
        telefono: "+595985789012",
        fecha_nacimiento: new Date("1988-11-08"),
        rol: "usuario",
        estado: "activo",
        preferencias: {
          notificaciones_email: true,
          notificaciones_sms: true,
          deportes_favoritos: ["tenis", "padel"],
        },
      },
    ];

    await Usuario.insertMany(usuarios);
    console.log("Usuarios creados exitosamente");

    // Crear canchas específicas de Loma Plata
    const canchas = [
      {
        nombre: "Cancha Municipal de Fútbol",
        tipo: "Fútbol 11",
        ubicacion: {
          direccion: "Av. Central 1234",
          ciudad: "Loma Plata",
          coordenadas: {
            latitud: -22.3694,
            longitud: -59.8372,
          },
        },
        imagenes: [],
        precio_hora: 150000,
        horarios_disponibles: [
          { dia: "lunes", desde: "08:00", hasta: "22:00" },
          { dia: "martes", desde: "08:00", hasta: "22:00" },
          { dia: "miércoles", desde: "08:00", hasta: "22:00" },
          { dia: "jueves", desde: "08:00", hasta: "22:00" },
          { dia: "viernes", desde: "08:00", hasta: "22:00" },
          { dia: "sábado", desde: "06:00", hasta: "23:00" },
          { dia: "domingo", desde: "06:00", hasta: "23:00" },
        ],
        estado: "activo",
      },
      {
        nombre: "Club Deportivo Loma Plata - Cancha de Tenis",
        tipo: "Tenis",
        ubicacion: {
          direccion: "Calle Deportiva 567",
          ciudad: "Loma Plata",
          coordenadas: {
            latitud: -22.372,
            longitud: -59.835,
          },
        },
        imagenes: [],
        precio_hora: 80000,
        horarios_disponibles: [
          { dia: "lunes", desde: "07:00", hasta: "21:00" },
          { dia: "martes", desde: "07:00", hasta: "21:00" },
          { dia: "miércoles", desde: "07:00", hasta: "21:00" },
          { dia: "jueves", desde: "07:00", hasta: "21:00" },
          { dia: "viernes", desde: "07:00", hasta: "21:00" },
          { dia: "sábado", desde: "07:00", hasta: "22:00" },
          { dia: "domingo", desde: "08:00", hasta: "20:00" },
        ],
        estado: "activo",
      },
      {
        nombre: "Polideportivo Central - Básquet",
        tipo: "Básquet",
        ubicacion: {
          direccion: "Av. Independencia 890",
          ciudad: "Loma Plata",
          coordenadas: {
            latitud: -22.368,
            longitud: -59.84,
          },
        },
        imagenes: [],
        precio_hora: 120000,
        horarios_disponibles: [
          { dia: "lunes", desde: "09:00", hasta: "21:00" },
          { dia: "martes", desde: "09:00", hasta: "21:00" },
          { dia: "miércoles", desde: "09:00", hasta: "21:00" },
          { dia: "jueves", desde: "09:00", hasta: "21:00" },
          { dia: "viernes", desde: "09:00", hasta: "21:00" },
          { dia: "sábado", desde: "08:00", hasta: "22:00" },
          { dia: "domingo", desde: "08:00", hasta: "21:00" },
        ],
        estado: "activo",
      },
      {
        nombre: "Cancha de Fútbol 5 - Los Pinos",
        tipo: "Fútbol 5",
        ubicacion: {
          direccion: "Barrio Los Pinos, Calle 15 de Agosto 234",
          ciudad: "Loma Plata",
          coordenadas: {
            latitud: -22.365,
            longitud: -59.832,
          },
        },
        imagenes: [],
        precio_hora: 100000,
        horarios_disponibles: [
          { dia: "lunes", desde: "18:00", hasta: "23:00" },
          { dia: "martes", desde: "18:00", hasta: "23:00" },
          { dia: "miércoles", desde: "18:00", hasta: "23:00" },
          { dia: "jueves", desde: "18:00", hasta: "23:00" },
          { dia: "viernes", desde: "18:00", hasta: "24:00" },
          { dia: "sábado", desde: "08:00", hasta: "24:00" },
          { dia: "domingo", desde: "08:00", hasta: "23:00" },
        ],
        estado: "activo",
      },
      {
        nombre: "Cancha de Pádel Premium",
        tipo: "Pádel",
        ubicacion: {
          direccion: "Complejo Deportivo Premium, Av. Paraguay 456",
          ciudad: "Loma Plata",
          coordenadas: {
            latitud: -22.371,
            longitud: -59.838,
          },
        },
        imagenes: [],
        precio_hora: 90000,
        horarios_disponibles: [
          { dia: "lunes", desde: "07:00", hasta: "22:00" },
          { dia: "martes", desde: "07:00", hasta: "22:00" },
          { dia: "miércoles", desde: "07:00", hasta: "22:00" },
          { dia: "jueves", desde: "07:00", hasta: "22:00" },
          { dia: "viernes", desde: "07:00", hasta: "23:00" },
          { dia: "sábado", desde: "07:00", hasta: "23:00" },
          { dia: "domingo", desde: "08:00", hasta: "22:00" },
        ],
        estado: "activo",
      },
      {
        nombre: "Cancha de Vóley - Centro Comunitario",
        tipo: "Vóley",
        ubicacion: {
          direccion: "Centro Comunitario, Calle Chaco 123",
          ciudad: "Loma Plata",
          coordenadas: {
            latitud: -22.373,
            longitud: -59.836,
          },
        },
        imagenes: [],
        precio_hora: 70000,
        horarios_disponibles: [
          { dia: "lunes", desde: "16:00", hasta: "21:00" },
          { dia: "martes", desde: "16:00", hasta: "21:00" },
          { dia: "miércoles", desde: "16:00", hasta: "21:00" },
          { dia: "jueves", desde: "16:00", hasta: "21:00" },
          { dia: "viernes", desde: "16:00", hasta: "22:00" },
          { dia: "sábado", desde: "09:00", hasta: "22:00" },
          { dia: "domingo", desde: "09:00", hasta: "21:00" },
        ],
        estado: "activo",
      },
    ];

    await Cancha.insertMany(canchas);
    console.log("Canchas de Loma Plata creadas exitosamente");

    console.log("\n=== DATOS DE EJEMPLO ===");
    console.log("Admin: admin@lomaplata.com / admin123");
    console.log("Usuario 1: juan.perez@lomaplata.com / user123");
    console.log("Usuario 2: maria.lopez@lomaplata.com / user123");
    console.log("========================\n");

    console.log("Seed completado exitosamente para Loma Plata");
  } catch (error) {
    console.error("Error en seed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  }
}

seedDatabase();
