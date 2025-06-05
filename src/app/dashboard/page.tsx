"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  Plus,
  Eye,
  CalendarDays,
  CreditCard,
} from "lucide-react";

interface DashboardStats {
  total_canchas: number;
  total_reservas: number;
  reservas_hoy: number;
  ingresos_mes: number;
  reservas_pendientes: number;
  canchas_activas: number;
}

interface ReservaReciente {
  _id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  cancha_id: {
    nombre: string;
    tipo: string;
  };
  usuario_id: {
    nombre_completo: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservasRecientes, setReservasRecientes] = useState<ReservaReciente[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Simular datos para el dashboard (aquí se conectarían las APIs reales)
        const mockStats: DashboardStats = {
          total_canchas: 6,
          total_reservas: 124,
          reservas_hoy: 8,
          ingresos_mes: 2450000,
          reservas_pendientes: 3,
          canchas_activas: 6,
        };

        const mockReservas: ReservaReciente[] = [
          {
            _id: "1",
            fecha: "2024-01-15",
            hora_inicio: "18:00",
            hora_fin: "19:00",
            estado: "confirmada",
            cancha_id: {
              nombre: "Cancha Municipal de Fútbol",
              tipo: "Fútbol 11",
            },
            usuario_id: {
              nombre_completo: "Juan Pérez",
            },
          },
          {
            _id: "2",
            fecha: "2024-01-15",
            hora_inicio: "20:00",
            hora_fin: "21:00",
            estado: "pendiente",
            cancha_id: {
              nombre: "Club Deportivo - Tenis",
              tipo: "Tenis",
            },
            usuario_id: {
              nombre_completo: "María López",
            },
          },
        ];

        setStats(mockStats);
        setReservasRecientes(mockReservas);
      } catch (err) {
        setError("Error al cargar datos del dashboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return "bg-green-100 text-green-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-700 font-medium">
              Cargando dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header del Dashboard */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard SpelPlaut
              </h1>
              <p className="text-sm sm:text-base text-gray-700 font-medium mt-1">
                Gestiona canchas y reservas en Loma Plata
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Link href="/admin/canchas" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cancha
                </Button>
              </Link>
              <Link href="/admin/reservas" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl text-emerald-600">
                {stats?.total_canchas || 0}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                Canchas Activas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl text-blue-600">
                {stats?.reservas_hoy || 0}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                Reservas Hoy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl text-yellow-600">
                {stats?.reservas_pendientes || 0}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Pendientes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base text-green-600 truncate">
                {formatearPrecio(stats?.ingresos_mes || 0)}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                Este Mes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Acciones Rápidas - Solo móvil */}
        <div className="block sm:hidden mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/canchas">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Ver Canchas</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/reservas">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Reservas</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Grid para desktop, stack para móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Reservas Recientes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Reservas Recientes
                </CardTitle>
                <CardDescription className="text-sm">
                  Últimas reservas realizadas en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {reservasRecientes.length === 0 ? (
                    <p className="text-gray-700 font-medium text-center py-4">
                      No hay reservas recientes
                    </p>
                  ) : (
                    reservasRecientes.map((reserva) => (
                      <div
                        key={reserva._id}
                        className="border-l-4 border-emerald-500 pl-4 py-2 bg-gray-50 rounded-r-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                              {reserva.cancha_id.nombre}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-700 font-medium">
                              {reserva.usuario_id.nombre_completo} •{" "}
                              {reserva.cancha_id.tipo}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                              <Calendar className="h-3 w-3" />
                              {reserva.fecha}
                              <Clock className="h-3 w-3 ml-2" />
                              {reserva.hora_inicio} - {reserva.hora_fin}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                              reserva.estado
                            )} whitespace-nowrap`}
                          >
                            {reserva.estado}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href="/admin/reservas">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Ver Todas las Reservas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Resumen del Día */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">
                      Reservas confirmadas
                    </span>
                    <span className="font-medium">
                      {stats?.reservas_hoy || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">
                      Pendientes
                    </span>
                    <span className="font-medium">
                      {stats?.reservas_pendientes || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">
                      Canchas ocupadas
                    </span>
                    <span className="font-medium">
                      4 de {stats?.total_canchas || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enlaces Rápidos - Solo desktop */}
            <Card className="hidden sm:block">
              <CardHeader>
                <CardTitle className="text-lg">Enlaces Rápidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/admin/canchas">
                    <Button variant="ghost" className="w-full justify-start">
                      <MapPin className="h-4 w-4 mr-2" />
                      Gestionar Canchas
                    </Button>
                  </Link>
                  <Link href="/admin/usuarios">
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Gestionar Usuarios
                    </Button>
                  </Link>
                  <Link href="/admin/pagos">
                    <Button variant="ghost" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Historial de Pagos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
