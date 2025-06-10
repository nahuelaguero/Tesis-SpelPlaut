import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import Cancha from "@/models/Cancha";
import Reserva from "@/models/Reserva";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/types";

export async function POST() {
  try {
    await connectDB();

    // Verificar si ya hay datos
    const existingUsers = await Usuario.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "La base de datos ya tiene datos. Use DELETE para limpiar primero.",
        },
        { status: 400 }
      );
    }

    // Crear usuarios de prueba
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await Usuario.create({
      nombre_completo: "Administrador Sistema",
      email: "admin@spelplaut.com",
      telefono: "+595981234567",
      rol: "admin",
      contrasena_hash: hashedPassword,
      autenticacion_2FA: false,
      preferencias: {
        tema: "claro",
        notificaciones: true,
      },
      fecha_registro: new Date(),
    });

    const propietarioUser = await Usuario.create({
      nombre_completo: "Juan Pérez - Propietario",
      email: "juan@spelplaut.com",
      telefono: "+595987654321",
      rol: "propietario_cancha",
      contrasena_hash: hashedPassword,
      autenticacion_2FA: false,
      preferencias: {
        tema: "claro",
        notificaciones: true,
      },
      fecha_registro: new Date(),
    });

    const normalUser = await Usuario.create({
      nombre_completo: "María González",
      email: "maria@example.com",
      telefono: "+595983456789",
      rol: "usuario",
      contrasena_hash: hashedPassword,
      autenticacion_2FA: false,
      preferencias: {
        tema: "claro",
        notificaciones: true,
      },
      fecha_registro: new Date(),
    });

    // Crear canchas de prueba
    const canchas = [
      {
        nombre: "Complejo Deportivo Central",
        descripcion:
          "Cancha de fútbol 11 con césped natural de excelente calidad. Vestuarios, duchas y estacionamiento incluidos.",
        tipo_cancha: "Football11",
        ubicacion: "Av. Principal 123, Loma Plata",
        imagenes: ["/api/placeholder/600/400"],
        precio_por_hora: 150000,
        capacidad_jugadores: 22,
        horario_apertura: "07:00",
        horario_cierre: "22:00",
        disponible: true,
        dias_operativos: [
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
          "domingo",
        ],
        propietario_id: propietarioUser._id,
      },
      {
        nombre: "Futsal Don Bosco",
        descripcion:
          "Cancha de futsal techada con piso sintético. Ideal para entrenamientos y competencias.",
        tipo_cancha: "Football5",
        ubicacion: "Calle Secundaria 456, Loma Plata",
        imagenes: ["/api/placeholder/600/400"],
        precio_por_hora: 80000,
        capacidad_jugadores: 10,
        horario_apertura: "06:00",
        horario_cierre: "23:00",
        disponible: true,
        dias_operativos: [
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
        ],
        propietario_id: propietarioUser._id,
      },
      {
        nombre: "Tennis Club Elite",
        descripcion:
          "Cancha de tenis profesional con superficie de polvo de ladrillo. Incluye alquiler de raquetas.",
        tipo_cancha: "Tennis",
        ubicacion: "Barrio Residencial, Loma Plata",
        imagenes: ["/api/placeholder/600/400"],
        precio_por_hora: 120000,
        capacidad_jugadores: 4,
        horario_apertura: "08:00",
        horario_cierre: "20:00",
        disponible: true,
        dias_operativos: [
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
          "domingo",
        ],
        propietario_id: propietarioUser._id,
      },
      {
        nombre: "Basketball Arena",
        descripcion:
          "Cancha de básquet cubierta con piso de parquet. Aros reglamentarios y marcador electrónico.",
        tipo_cancha: "Basketball",
        ubicacion: "Centro Deportivo Municipal, Loma Plata",
        imagenes: ["/api/placeholder/600/400"],
        precio_por_hora: 100000,
        capacidad_jugadores: 10,
        horario_apertura: "09:00",
        horario_cierre: "21:00",
        disponible: true,
        dias_operativos: ["lunes", "miercoles", "viernes", "sabado", "domingo"],
        propietario_id: propietarioUser._id,
      },
      {
        nombre: "Pádel Paradise",
        descripcion:
          "Cancha de pádel con paredes de cristal y césped artificial. Raquetas y pelotas disponibles.",
        tipo_cancha: "Padel",
        ubicacion: "Complejo Deportivo Norte, Loma Plata",
        imagenes: ["/api/placeholder/600/400"],
        precio_por_hora: 90000,
        capacidad_jugadores: 4,
        horario_apertura: "07:00",
        horario_cierre: "22:00",
        disponible: true,
        dias_operativos: [
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
          "domingo",
        ],
        propietario_id: propietarioUser._id,
      },
      {
        nombre: "Volley Beach",
        descripcion:
          "Cancha de vóley playa con arena importada. Ambiente al aire libre con vista panorámica.",
        tipo_cancha: "Volleyball",
        ubicacion: "Zona Recreativa, Loma Plata",
        imagenes: ["/api/placeholder/600/400"],
        precio_por_hora: 70000,
        capacidad_jugadores: 12,
        horario_apertura: "08:00",
        horario_cierre: "19:00",
        disponible: true,
        dias_operativos: ["viernes", "sabado", "domingo"],
        propietario_id: propietarioUser._id,
      },
    ];

    const canchasCreadas = await Cancha.insertMany(canchas);

    // Crear algunas reservas de ejemplo
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const reservas = [
      {
        usuario_id: normalUser._id,
        cancha_id: canchasCreadas[0]._id,
        fecha: tomorrow.toISOString().split("T")[0],
        hora_inicio: "15:00",
        hora_fin: "16:00",
        precio_total: 150000,
        estado: "confirmada",
        fecha_reserva: new Date(),
      },
      {
        usuario_id: normalUser._id,
        cancha_id: canchasCreadas[1]._id,
        fecha: dayAfter.toISOString().split("T")[0],
        hora_inicio: "18:00",
        hora_fin: "19:00",
        precio_total: 80000,
        estado: "pendiente",
        fecha_reserva: new Date(),
      },
      {
        usuario_id: adminUser._id,
        cancha_id: canchasCreadas[2]._id,
        fecha: dayAfter.toISOString().split("T")[0],
        hora_inicio: "10:00",
        hora_fin: "11:00",
        precio_total: 120000,
        estado: "confirmada",
        fecha_reserva: new Date(),
      },
    ];

    await Reserva.insertMany(reservas);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Base de datos poblada exitosamente",
      data: {
        usuarios: 3,
        canchas: canchasCreadas.length,
        reservas: reservas.length,
        credenciales: {
          admin: { email: "admin@spelplaut.com", password: "admin123" },
          propietario: { email: "juan@spelplaut.com", password: "admin123" },
          usuario: { email: "maria@example.com", password: "admin123" },
        },
      },
    });
  } catch (error) {
    console.error("Error poblando base de datos:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error al poblar la base de datos",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await connectDB();

    // Limpiar todas las colecciones
    await Usuario.deleteMany({});
    await Cancha.deleteMany({});
    await Reserva.deleteMany({});

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Base de datos limpiada exitosamente",
    });
  } catch (error) {
    console.error("Error limpiando base de datos:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error al limpiar la base de datos",
      },
      { status: 500 }
    );
  }
}
