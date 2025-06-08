import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { requireAdmin } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verificar que sea administrador
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Acceso denegado. Solo administradores pueden ver reportes",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "3m";

    // Calcular fechas según el período
    const fechaFin = new Date();
    const fechaInicio = new Date();

    switch (periodo) {
      case "1m":
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      case "3m":
        fechaInicio.setMonth(fechaInicio.getMonth() - 3);
        break;
      case "6m":
        fechaInicio.setMonth(fechaInicio.getMonth() - 6);
        break;
      case "1y":
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        break;
      default:
        fechaInicio.setMonth(fechaInicio.getMonth() - 3);
    }

    // 1. Obtener ingresos mensuales
    const ingresosMensuales = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
          estado: "confirmada",
        },
      },
      {
        $group: {
          _id: {
            año: { $year: "$fecha" },
            mes: { $month: "$fecha" },
          },
          ingresos: { $sum: "$precio_total" },
          reservas: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.año": 1, "_id.mes": 1 },
      },
      {
        $project: {
          mes: {
            $concat: [
              {
                $switch: {
                  branches: [
                    { case: { $eq: ["$_id.mes", 1] }, then: "Enero" },
                    { case: { $eq: ["$_id.mes", 2] }, then: "Febrero" },
                    { case: { $eq: ["$_id.mes", 3] }, then: "Marzo" },
                    { case: { $eq: ["$_id.mes", 4] }, then: "Abril" },
                    { case: { $eq: ["$_id.mes", 5] }, then: "Mayo" },
                    { case: { $eq: ["$_id.mes", 6] }, then: "Junio" },
                    { case: { $eq: ["$_id.mes", 7] }, then: "Julio" },
                    { case: { $eq: ["$_id.mes", 8] }, then: "Agosto" },
                    { case: { $eq: ["$_id.mes", 9] }, then: "Septiembre" },
                    { case: { $eq: ["$_id.mes", 10] }, then: "Octubre" },
                    { case: { $eq: ["$_id.mes", 11] }, then: "Noviembre" },
                    { case: { $eq: ["$_id.mes", 12] }, then: "Diciembre" },
                  ],
                  default: "Desconocido",
                },
              },
              " ",
              { $toString: "$_id.año" },
            ],
          },
          ingresos: 1,
          reservas: 1,
        },
      },
    ]);

    // 2. Obtener canchas más populares
    const canchasMasPopulares = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
          estado: "confirmada",
        },
      },
      {
        $group: {
          _id: "$cancha_id",
          reservas: { $sum: 1 },
          ingresos: { $sum: "$precio_total" },
        },
      },
      {
        $lookup: {
          from: "chancas",
          localField: "_id",
          foreignField: "_id",
          as: "cancha",
        },
      },
      {
        $unwind: "$cancha",
      },
      {
        $project: {
          nombre: "$cancha.nombre",
          reservas: 1,
          ingresos: 1,
        },
      },
      {
        $sort: { reservas: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // 3. Estadísticas de horarios
    const estadisticasHorarios = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
          estado: "confirmada",
        },
      },
      {
        $project: {
          hora: { $hour: { $dateFromString: { dateString: "$hora_inicio" } } },
        },
      },
      {
        $group: {
          _id: "$hora",
          reservas: { $sum: 1 },
        },
      },
      {
        $sort: { reservas: -1 },
      },
    ]);

    // 4. Resumen general
    const reservasTotal = await Reserva.countDocuments({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: "confirmada",
    });

    const ingresosTotal = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
          estado: "confirmada",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$precio_total" },
        },
      },
    ]);

    const canchasActivas = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
          estado: "confirmada",
        },
      },
      {
        $group: {
          _id: "$cancha_id",
        },
      },
      {
        $count: "total",
      },
    ]);

    const totalIngresos = ingresosTotal[0]?.total || 0;
    const promedioPorReserva =
      reservasTotal > 0 ? totalIngresos / reservasTotal : 0;

    const reporteData = {
      ingresosMensuales,
      canchasMasPopulares,
      estadisticasHorarios,
      resumenGeneral: {
        totalIngresos: totalIngresos,
        totalReservas: reservasTotal,
        promedioPorReserva: promedioPorReserva,
        canchasMasActivas: canchasActivas[0]?.total || 0,
      },
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Reporte generado exitosamente",
      data: reporteData,
    });
  } catch (error) {
    console.error("Error al generar reporte:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Error interno del servidor",
        data: null,
      },
      { status: 500 }
    );
  }
}
