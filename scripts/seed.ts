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
  {
    nombre_completo: "Leander Krahn",
    email: "leander.krahn@lomaplata.com",
    telefono: "+595981234567",
    password: "propietario123",
    rol: "propietario_cancha",
  },
];

const canchas = [
  {
    nombre: "Cancha de Fútbol 11 - Estadio Municipal",
    descripcion:
      "Cancha de fútbol completa con césped natural en el Estadio Municipal de Loma Plata",
    tipo_cancha: "Football11",
    ubicacion: "Estadio Municipal, Loma Plata",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 22,
    precio_por_hora: 150000,
    horario_apertura: "06:00",
    horario_cierre: "22:00",
    disponible: true,
    propietario_id: null, // Se asignará después cuando tengamos el ID del admin
  },
  {
    nombre: "Cancha de Fútbol 5 - Centro Deportivo",
    descripcion:
      "Cancha de fútbol 5 con césped sintético en el centro de Loma Plata",
    tipo_cancha: "Football5",
    ubicacion: "Centro Deportivo Comunitario, Loma Plata",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 10,
    precio_por_hora: 80000,
    horario_apertura: "06:00",
    horario_cierre: "23:00",
    disponible: true,
    propietario_id: null,
  },
  {
    nombre: "Cancha de Tenis - Club Fernheim",
    descripcion:
      "Cancha de tenis con superficie de polvo de ladrillo en el Club Fernheim",
    tipo_cancha: "Tennis",
    ubicacion: "Club Fernheim, Filadelfia (cerca de Loma Plata)",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 2,
    precio_por_hora: 60000,
    horario_apertura: "06:00",
    horario_cierre: "22:00",
    disponible: true,
    propietario_id: null,
  },
  {
    nombre: "Cancha de Básquet - Polideportivo Municipal",
    descripcion:
      "Cancha de básquet techada con piso de parquet en el Polideportivo Municipal",
    tipo_cancha: "Basketball",
    ubicacion: "Polideportivo Municipal, Loma Plata",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 10,
    precio_por_hora: 100000,
    horario_apertura: "07:00",
    horario_cierre: "22:00",
    disponible: true,
    propietario_id: null,
  },
  {
    nombre: "Cancha de Pádel - Centro Recreativo",
    descripcion: "Cancha de pádel con paredes de cristal y césped sintético",
    tipo_cancha: "Padel",
    ubicacion: "Centro Recreativo, Loma Plata",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 4,
    precio_por_hora: 90000,
    horario_apertura: "06:00",
    horario_cierre: "23:00",
    disponible: true,
    propietario_id: null,
  },
  {
    nombre: "Cancha de Vóley - Complejo Deportivo",
    descripcion: "Cancha de vóley playa con arena importada",
    tipo_cancha: "Volleyball",
    ubicacion: "Complejo Deportivo Las Palmas, Loma Plata",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 12,
    precio_por_hora: 70000,
    horario_apertura: "06:00",
    horario_cierre: "21:00",
    disponible: true,
    propietario_id: null,
  },
  {
    nombre: "Kranhfield",
    descripcion:
      "Cancha de Fútbol 5 con pasto sintético de alta calidad. Propiedad de Leander Krahn. Iluminación nocturna LED y estacionamiento.",
    tipo_cancha: "Football5",
    ubicacion: "Krahnfield, Loma Plata, Boquerón, Paraguay",
    imagenes: ["/api/placeholder/600/400"],
    capacidad_jugadores: 10,
    precio_por_hora: 100000,
    horario_apertura: "07:00",
    horario_cierre: "22:00",
    disponible: true,
    propietario_id: null, // Se asignará a Leander Krahn
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

    // Obtener IDs de propietarios
    const adminUser = await db.collection("users").findOne({ rol: "admin" });
    const adminId = adminUser?._id;

    const leanderUser = await db
      .collection("users")
      .findOne({ email: "leander.krahn@lomaplata.com" });
    const leanderId = leanderUser?._id;

    // Crear canchas con propietario_id correspondiente
    const canchasWithDates = canchas.map((cancha) => ({
      ...cancha,
      propietario_id:
        cancha.nombre === "Kranhfield" ? leanderId : adminId,
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
    console.log(
      "   Propietario: leander.krahn@lomaplata.com / propietario123"
    );
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
