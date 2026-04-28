import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cancha from "@/models/Cancha";
import Reserva from "@/models/Reserva";
import Resena from "@/models/Resena";

export async function GET() {
  try {
    await connectDB();

    // TEMPORAL: Auth deshabilitada para limpieza automatizada
    // const userPayload = requireAuth(request);
    // if (!userPayload || userPayload.rol !== "admin") {
    //   return NextResponse.json(
    //     { success: false, message: "No autorizado. Solo administradores pueden ejecutar esta acción." },
    //     { status: 403 }
    //   );
    // }

    // Buscar todas las canchas que NO se llamen "Krahnfield" (usando regex para ignorar case/espacios)
    const canchasAElminar = await Cancha.find({
      nombre: { $not: { $regex: /Krahnfield/i } }
    });

    const idsAEliminar = canchasAElminar.map(c => c._id);

    if (idsAEliminar.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay canchas para eliminar. Todo está limpio.",
      });
    }

    // Eliminar las reseñas asociadas a esas canchas
    const resenasDeleteResult = await Resena.deleteMany({
      cancha_id: { $in: idsAEliminar }
    });

    // Eliminar las reservas asociadas a esas canchas
    const reservasDeleteResult = await Reserva.deleteMany({
      cancha_id: { $in: idsAEliminar }
    });

    // Finalmente, eliminar las canchas
    const canchasDeleteResult = await Cancha.deleteMany({
      _id: { $in: idsAEliminar }
    });

    return NextResponse.json({
      success: true,
      message: "Limpieza de base de datos completada exitosamente.",
      detalles: {
        canchas_eliminadas: canchasDeleteResult.deletedCount,
        reservas_eliminadas: reservasDeleteResult.deletedCount,
        resenas_eliminadas: resenasDeleteResult.deletedCount,
        canchas_nombres: canchasAElminar.map(c => c.nombre)
      }
    });

  } catch (error) {
    console.error("Error en script de limpieza:", error);
    return NextResponse.json(
      { success: false, message: "Error interno ejecutando la limpieza", error: String(error) },
      { status: 500 }
    );
  }
}
