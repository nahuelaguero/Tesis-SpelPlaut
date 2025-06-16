"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Calendar,
  MapPin,
  BarChart3,
  Settings,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface EstadisticasAdmin {
  total_usuarios: number;
  total_canchas: number;
  total_reservas: number;
  reservas_hoy: number;
  ingresos_mes: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasAdmin | null>(
    null
  );
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.rol !== "admin")) {
      router.push("/");
      return;
    }

    const fetchEstadisticas = async () => {
      if (!user || user.rol !== "admin") return;

      try {
        const response = await fetch("/api/admin/estadisticas", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setEstadisticas(data.data);
          }
        } else {
          console.error("Error al obtener estadísticas:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoadingEstadisticas(false);
      }
    };

    if (user && user.rol === "admin") {
      fetchEstadisticas();
    }
  }, [user, loading, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading || loadingEstadisticas) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-600" />
            <p className="mt-4 text-gray-700 font-medium">
              Cargando panel de administración...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.rol !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-gray-700 font-medium mb-6">
              No tienes permisos para acceder a esta página.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold">
              Panel de Administración
            </h1>
            <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto">
              Gestiona canchas, reservas y usuarios de SpelPlaut.
            </p>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Estadísticas Generales
          </h2>

          {estadisticas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Usuarios Totales
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {estadisticas.total_usuarios}
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    usuarios registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Canchas
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {estadisticas.total_canchas}
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    canchas disponibles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Reservas Totales
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {estadisticas.total_reservas}
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    reservas realizadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Ingresos del Mes
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(estadisticas.ingresos_mes)}
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    en el mes actual
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="animate-pulse h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Acciones Rápidas */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-xl text-gray-900">
                    Agregar Cancha
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-700 font-medium">
                  Registra una nueva cancha en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/admin/canchas/nueva")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Agregar Nueva Cancha
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl text-gray-900">
                    Ver Reservas
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-700 font-medium">
                  Gestiona todas las reservas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/admin/reservas")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Gestionar Reservas
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-xl text-gray-900">
                    Usuarios
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-700 font-medium">
                  Administra los usuarios registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/admin/usuarios")}
                    variant="outline"
                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    Ver Usuarios
                  </Button>
                  <Button
                    onClick={() => router.push("/register")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Crear Usuario
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-xl text-gray-900">
                    Reportes
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-700 font-medium">
                  Genera reportes de ingresos y estadísticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/admin/reportes")}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Ver Reportes
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-xl text-gray-900">
                    Configuración
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-700 font-medium">
                  Ajustes generales del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gray-600 hover:bg-gray-700">
                  Configurar Sistema
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-xl text-gray-900">
                    Gestionar Canchas
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-700 font-medium">
                  Edita y administra canchas existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/admin/canchas")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Ver Canchas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
