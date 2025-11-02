"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, DollarSign, Users, Clock, Building } from "lucide-react";
import { PropietarioDashboard } from "@/types";

export default function MiCanchaPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] =
    useState<PropietarioDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<string>("");

  const fetchDashboardData = useCallback(async (canchaId?: string) => {
    try {
      setLoading(true);
      const url = canchaId
        ? `/api/propietario/dashboard?cancha_id=${canchaId}`
        : "/api/propietario/dashboard";

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
        setError("");
      } else {
        setError(data.message || "Error al cargar datos del dashboard");
      }
    } catch (error) {
      console.error("Error al obtener dashboard:", error);
      setError("Error de conexión al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.rol === "propietario_cancha") {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleCanchaChange = (canchaId: string) => {
    setCanchaSeleccionada(canchaId);
    if (canchaId === "todas") {
      fetchDashboardData();
    } else {
      fetchDashboardData(canchaId);
    }
  };

  if (!user || user.rol !== "propietario_cancha") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600 mt-2">
            Solo los propietarios de cancha pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={() => fetchDashboardData()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600">Sin Datos</h1>
          <p className="text-gray-600 mt-2">
            No se encontraron datos del dashboard.
          </p>
        </div>
      </div>
    );
  }

  const {
    canchas,
    cancha_seleccionada,
    estadisticas_consolidadas,
    estadisticas_cancha,
    reservas_recientes,
  } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tus canchas y visualiza estadísticas
        </p>
      </div>

      {/* Selector de Cancha */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Building className="h-5 w-5 text-gray-600" />
          <Select value={canchaSeleccionada} onValueChange={handleCanchaChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar cancha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">📊 Vista Consolidada</SelectItem>
              {canchas.map((cancha) => (
                <SelectItem key={cancha._id} value={cancha._id}>
                  🏟️ {cancha.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Mostrar estadísticas consolidadas o de cancha específica */}
        {cancha_seleccionada ? (
          // Estadísticas de cancha específica
          estadisticas_cancha && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reservas Hoy
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {estadisticas_cancha.reservas_hoy}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Mes
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${estadisticas_cancha.ingresos_mes.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reservas Semana
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {estadisticas_cancha.reservas_semana}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ocupación Promedio
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {estadisticas_cancha.ocupacion_promedio}%
                  </div>
                </CardContent>
              </Card>
            </>
          )
        ) : (
          // Estadísticas consolidadas
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Canchas
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas_consolidadas.total_canchas}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reservas Hoy
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas_consolidadas.reservas_hoy}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos Mes
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${estadisticas_consolidadas.ingresos_mes.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ocupación Promedio
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas_consolidadas.ocupacion_promedio}%
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Resumen de Canchas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Lista de Canchas */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Canchas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {canchas.map((cancha) => (
                <div
                  key={cancha._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{cancha.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      {cancha.tipo_cancha}
                    </p>
                    <p className="text-sm text-gray-500">{cancha.ubicacion}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${cancha.precio_por_hora}/hora
                    </p>
                    <p className="text-sm text-gray-600">
                      {cancha.total_reservas} reservas
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        cancha.disponible
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cancha.disponible ? "Disponible" : "No disponible"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reservas Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservas_recientes.length > 0 ? (
                reservas_recientes.slice(0, 5).map((reserva) => (
                  <div
                    key={reserva._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{reserva.cancha_nombre}</h4>
                      <p className="text-sm text-gray-600">
                        {reserva.usuario.nombre_completo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reserva.fecha} - {reserva.hora_inicio}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${reserva.precio_total}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          reserva.estado === "confirmada"
                            ? "bg-green-100 text-green-800"
                            : reserva.estado === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {reserva.estado}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay reservas recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
