// Script para poblar la base de datos con datos de ejemplo
// Ejecutar con: node scripts/seed-data.js

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb://localhost:27017/reserva-cancha-app";

const sampleData = {
  canchas: [
    {
      nombre: "Cancha Fútbol 5 - Principal",
      tipo: "fútbol 5",
      ubicacion: {
        direccion: "Av. Mariscal López 1234",
        ciudad: "Asunción",
      },
      imagenes: ["/images/cancha1-1.jpg", "/images/cancha1-2.jpg"],
      precio_hora: 150000,
      horarios_disponibles: [
        { dia: "lunes", desde: "08:00", hasta: "22:00" },
        { dia: "martes", desde: "08:00", hasta: "22:00" },
        { dia: "miércoles", desde: "08:00", hasta: "22:00" },
        { dia: "jueves", desde: "08:00", hasta: "22:00" },
        { dia: "viernes", desde: "08:00", hasta: "23:00" },
        { dia: "sábado", desde: "07:00", hasta: "23:00" },
        { dia: "domingo", desde: "07:00", hasta: "22:00" },
      ],
      estado: "activo",
    },
    {
      nombre: "Cancha Fútbol 5 - Secundaria",
      tipo: "fútbol 5",
      ubicacion: {
        direccion: "Av. Mariscal López 1234",
        ciudad: "Asunción",
      },
      imagenes: ["/images/cancha2-1.jpg"],
      precio_hora: 120000,
      horarios_disponibles: [
        { dia: "lunes", desde: "09:00", hasta: "21:00" },
        { dia: "martes", desde: "09:00", hasta: "21:00" },
        { dia: "miércoles", desde: "09:00", hasta: "21:00" },
        { dia: "jueves", desde: "09:00", hasta: "21:00" },
        { dia: "viernes", desde: "09:00", hasta: "22:00" },
        { dia: "sábado", desde: "08:00", hasta: "22:00" },
        { dia: "domingo", desde: "08:00", hasta: "21:00" },
      ],
      estado: "activo",
    },
    {
      nombre: "Cancha Tenis - Court 1",
      tipo: "tenis",
      ubicacion: {
        direccion: "Av. España 567",
        ciudad: "Asunción",
      },
      imagenes: ["/images/tenis1-1.jpg"],
      precio_hora: 80000,
      horarios_disponibles: [
        { dia: "lunes", desde: "06:00", hasta: "20:00" },
        { dia: "martes", desde: "06:00", hasta: "20:00" },
        { dia: "miércoles", desde: "06:00", hasta: "20:00" },
        { dia: "jueves", desde: "06:00", hasta: "20:00" },
        { dia: "viernes", desde: "06:00", hasta: "20:00" },
        { dia: "sábado", desde: "07:00", hasta: "19:00" },
        { dia: "domingo", desde: "07:00", hasta: "19:00" },
      ],
      estado: "activo",
    },
    {
      nombre: "Cancha Básquetbol",
      tipo: "básquetbol",
      ubicacion: {
        direccion: "Calle Palma 890",
        ciudad: "Luque",
      },
      imagenes: ["/images/basquet1-1.jpg"],
      precio_hora: 100000,
      horarios_disponibles: [
        { dia: "lunes", desde: "10:00", hasta: "21:00" },
        { dia: "martes", desde: "10:00", hasta: "21:00" },
        { dia: "miércoles", desde: "10:00", hasta: "21:00" },
        { dia: "jueves", desde: "10:00", hasta: "21:00" },
        { dia: "viernes", desde: "10:00", hasta: "22:00" },
        { dia: "sábado", desde: "09:00", hasta: "22:00" },
        { dia: "domingo", desde: "09:00", hasta: "21:00" },
      ],
      estado: "activo",
    },
    {
      nombre: "Cancha Pádel - Norte",
      tipo: "pádel",
      ubicacion: {
        direccion: "Av. Santísima Trinidad 456",
        ciudad: "Asunción",
      },
      imagenes: ["/images/padel1-1.jpg"],
      precio_hora: 180000,
      horarios_disponibles: [
        { dia: "lunes", desde: "07:00", hasta: "23:00" },
        { dia: "martes", desde: "07:00", hasta: "23:00" },
        { dia: "miércoles", desde: "07:00", hasta: "23:00" },
        { dia: "jueves", desde: "07:00", hasta: "23:00" },
        { dia: "viernes", desde: "07:00", hasta: "24:00" },
        { dia: "sábado", desde: "06:00", hasta: "24:00" },
        { dia: "domingo", desde: "06:00", hasta: "23:00" },
      ],
      estado: "activo",
    },
  ],
};

async function seedDatabase() {
  let client;

  try {
    console.log("Conectando a MongoDB...");
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();

    // Limpiar colecciones existentes
    console.log("Limpiando datos existentes...");
    await db.collection("canchas").deleteMany({});

    // Insertar canchas
    console.log("Insertando canchas de ejemplo...");
    const result = await db
      .collection("canchas")
      .insertMany(sampleData.canchas);
    console.log(`✅ ${result.insertedCount} canchas insertadas`);

    console.log("🎉 Datos de ejemplo insertados exitosamente!");
    console.log("\nDatos insertados:");
    console.log(`- ${sampleData.canchas.length} canchas`);

    console.log("\nPuedes ahora:");
    console.log("1. Crear una cuenta de usuario en /register");
    console.log("2. Explorar las canchas en /canchas");
    console.log("3. Hacer reservas de prueba");
  } catch (error) {
    console.error("❌ Error al insertar datos:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 Conexión a MongoDB cerrada");
    }
  }
}

// Ejecutar el script solo si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
