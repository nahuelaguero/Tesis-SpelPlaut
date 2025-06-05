import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// Datos de seed
const users = [
  {
    nombre_completo: "Admin SpelPlaut",
    email: "admin@lomaplata.com",
    telefono: "+595971123456",
    password: "admin123",
    rol: "admin",
  },
  {
    nombre_completo: "Juan Pérez",
    email: "juan.perez@lomaplata.com",
    telefono: "+595971234567",
    password: "user123",
    rol: "usuario",
  },
  {
    nombre_completo: "María López",
    email: "maria.lopez@lomaplata.com",
    telefono: "+595971345678",
    password: "user123",
    rol: "usuario",
  },
];

const canchas = [
  {
    nombre: "Cancha de Fútbol 11 - Estadio Municipal",
    descripcion:
      "Cancha de fútbol completa con césped natural en el Estadio Municipal de Loma Plata",
    deporte: "Football11",
    ubicacion: "Estadio Municipal, Loma Plata",
    imagen: "/api/placeholder/600/400",
    capacidadJugadores: 22,
    precioHora: 150000,
    horarioApertura: "06:00",
    horarioCierre: "22:00",
    equipamiento: [
      "Arcos reglamentarios",
      "Vestuarios",
      "Duchas",
      "Iluminación LED",
    ],
    estado: "disponible",
  },
  {
    nombre: "Cancha de Fútbol 5 - Centro Deportivo",
    descripcion:
      "Cancha de fútbol 5 con césped sintético en el centro de Loma Plata",
    deporte: "Football5",
    ubicacion: "Centro Deportivo Comunitario, Loma Plata",
    imagen: "/api/placeholder/600/400",
    capacidadJugadores: 10,
    precioHora: 80000,
    horarioApertura: "06:00",
    horarioCierre: "23:00",
    equipamiento: [
      "Arcos de fútbol 5",
      "Vestuarios",
      "Graderías",
      "Iluminación",
    ],
    estado: "disponible",
  },
  {
    nombre: "Cancha de Tenis - Club Fernheim",
    descripcion:
      "Cancha de tenis con superficie de polvo de ladrillo en el Club Fernheim",
    deporte: "Tennis",
    ubicacion: "Club Fernheim, Filadelfia (cerca de Loma Plata)",
    imagen: "/api/placeholder/600/400",
    capacidadJugadores: 2,
    precioHora: 60000,
    horarioApertura: "06:00",
    horarioCierre: "22:00",
    equipamiento: [
      "Red reglamentaria",
      "Marcador",
      "Bancos",
      "Iluminación nocturna",
    ],
    estado: "disponible",
  },
  {
    nombre: "Cancha de Básquet - Polideportivo Municipal",
    descripcion:
      "Cancha de básquet techada con piso de parquet en el Polideportivo Municipal",
    deporte: "Basketball",
    ubicacion: "Polideportivo Municipal, Loma Plata",
    imagen: "/api/placeholder/600/400",
    capacidadJugadores: 10,
    precioHora: 100000,
    horarioApertura: "07:00",
    horarioCierre: "22:00",
    equipamiento: [
      "Aros reglamentarios",
      "Graderías",
      "Vestuarios",
      "Aire acondicionado",
    ],
    estado: "disponible",
  },
  {
    nombre: "Cancha de Pádel - Centro Recreativo",
    descripcion: "Cancha de pádel con paredes de cristal y césped sintético",
    deporte: "Padel",
    ubicacion: "Centro Recreativo, Loma Plata",
    imagen: "/api/placeholder/600/400",
    capacidadJugadores: 4,
    precioHora: 90000,
    horarioApertura: "06:00",
    horarioCierre: "23:00",
    equipamiento: [
      "Paredes de cristal",
      "Red reglamentaria",
      "Iluminación LED",
      "Vestuarios",
    ],
    estado: "disponible",
  },
  {
    nombre: "Cancha de Vóley - Complejo Deportivo",
    descripcion: "Cancha de vóley playa con arena importada",
    deporte: "Volleyball",
    ubicacion: "Complejo Deportivo Las Palmas, Loma Plata",
    imagen: "/api/placeholder/600/400",
    capacidadJugadores: 12,
    precioHora: 70000,
    horarioApertura: "06:00",
    horarioCierre: "21:00",
    equipamiento: [
      "Red reglamentaria",
      "Arena de playa",
      "Graderías",
      "Duchas",
    ],
    estado: "disponible",
  },
];

async function seedDatabase() {
  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017/spelplaut"
  );

  try {
    await client.connect();
    console.log("🔗 Conectado a MongoDB");

    const db = client.db();

    // Limpiar colecciones existentes
    await db.collection("users").deleteMany({});
    await db.collection("canchas").deleteMany({});
    console.log("🧹 Colecciones limpiadas");

    // Crear usuarios con contraseñas hasheadas
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          contrasena_hash: await bcrypt.hash(password, 12),
          fecha_registro: new Date(),
        };
      })
    );

    const userResult = await db.collection("users").insertMany(hashedUsers);
    console.log(`👥 ${userResult.insertedCount} usuarios creados`);

    // Crear canchas
    const canchasWithDates = canchas.map((cancha) => ({
      ...cancha,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    }));

    const chanchaResult = await db
      .collection("canchas")
      .insertMany(canchasWithDates);
    console.log(`🏟️ ${chanchaResult.insertedCount} canchas creadas`);

    console.log("\n✅ Seed completado exitosamente!");
    console.log("\n📋 Usuarios de prueba:");
    console.log("   Admin: admin@lomaplata.com / admin123");
    console.log("   Usuario 1: juan.perez@lomaplata.com / user123");
    console.log("   Usuario 2: maria.lopez@lomaplata.com / user123");
  } catch (error) {
    console.error("❌ Error al hacer seed:", error);
  } finally {
    await client.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedDatabase().catch(console.error);
}
