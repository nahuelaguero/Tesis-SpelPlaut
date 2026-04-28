"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Settings,
  Users,
  XCircle,
  CalendarOff,
  Download,
  BarChart3,
} from "lucide-react";
import { PropietarioDashboard } from "@/types";

export default function MiCanchaPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] =
    useState<PropietarioDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<string>("todas");
  const [processingReservationId, setProcessingReservationId] = useState("");
  const [descargandoReporte, setDescargandoReporte] = useState(false);

  const fetchDashboardData = useCallback(async (canchaId?: string) => {
    try {
      setLoading(true);
      const url =
        canchaId && canchaId !== "todas"
          ? `/api/propietario/dashboard?cancha_id=${canchaId}`
          : "/api/propietario/dashboard";

      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar datos del dashboard");
      }

      setDashboardData(data.data);
      setError("");
    } catch (fetchError) {
      console.error("Error al obtener dashboard:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Error al cargar el dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.rol === "propietario_cancha") {
      void fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleCanchaChange = (canchaId: string) => {
    setCanchaSeleccionada(canchaId);
    void fetchDashboardData(canchaId);
  };

  const handleApproval = async (
    reservaId: string,
    accion: "aprobar" | "rechazar"
  ) => {
    const motivo =
      accion === "rechazar"
        ? window.prompt("Motivo del rechazo (opcional):") || ""
        : "";

    try {
      setProcessingReservationId(reservaId);
      setActionMessage("");

      const response = await fetch("/api/reservas/aprobacion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          reserva_id: reservaId,
          accion,
          motivo,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo procesar la reserva.");
      }

      setActionMessage(data.message);
      await fetchDashboardData(canchaSeleccionada);
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : "No se pudo procesar la reserva."
      );
    } finally {
      setProcessingReservationId("");
    }
  };

  if (!user || user.rol !== "propietario_cancha") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso denegado</h1>
          <p className="mt-2 text-gray-600">
            Solo los propietarios de cancha pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    canchas,
    cancha_seleccionada,
    estadisticas_consolidadas,
    estadisticas_cancha,
    reservas_recientes,
    reservas_pendientes_aprobacion = [],
  } = dashboardData;

  const stats = cancha_seleccionada ? estadisticas_cancha : estadisticas_consolidadas;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Gestiona disponibilidad, precios y aprobaciones de tus canchas.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/mi-cancha/disponibilidad" className="flex items-center">
              <CalendarOff className="mr-2 h-4 w-4" />
              Bloquear fechas
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mi-cancha/reportes" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Reportes
            </Link>
          </Button>
          <Button
            variant="outline"
            disabled={descargandoReporte || !reservas_recientes?.length}
            onClick={() => {
              setDescargandoReporte(true);
              try {
                const rows = reservas_recientes.map((r) => ({
                  cancha: r.cancha_nombre,
                  usuario: r.usuario.nombre_completo,
                  telefono: r.usuario.telefono || "Sin teléfono",
                  fecha: r.fecha,
                  hora_inicio: r.hora_inicio,
                  hora_fin: r.hora_fin,
                  precio_total: r.precio_total,
                  estado: r.estado,
                }));
                if (!rows.length) return;
                const headers = Object.keys(rows[0]);
                const csv = [
                  headers.join(","),
                  ...rows.map((r) =>
                    headers
                      .map((h) =>
                        JSON.stringify((r as Record<string, unknown>)[h] ?? "")
                      )
                      .join(",")
                  ),
                ].join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `reporte-reservas-${new Date()
                  .toISOString()
                  .slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } finally {
                setDescargandoReporte(false);
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {descargandoReporte ? "Generando..." : "Descargar CSV"}
          </Button>
          <Button asChild>
            <Link href="/mi-cancha/configuracion" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Configurar canchas
            </Link>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {actionMessage}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Building className="h-5 w-5 text-gray-600" />
        <Select value={canchaSeleccionada} onValueChange={handleCanchaChange}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Seleccionar cancha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Vista consolidada</SelectItem>
            {canchas.map((cancha) => (
              <SelectItem key={cancha._id} value={cancha._id}>
                {cancha.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reservas_hoy ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas semana</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.reservas_semana ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.ingresos_mes ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ocupación promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.ocupacion_promedio ?? 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Mis canchas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canchas.map((cancha) => (
              <div
                key={cancha._id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{cancha.nombre}</h3>
                    <p className="text-sm text-gray-600">{cancha.tipo_cancha}</p>
                    <p className="text-sm text-gray-500">{cancha.ubicacion}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      cancha.disponible
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {cancha.disponible ? "Disponible" : "Cerrada"}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>Precio base: ${cancha.precio_por_hora.toLocaleString()}/h</p>
                  <p>Intervalo: {cancha.intervalo_reserva_minutos || 60} min</p>
                  <p>
                    Confirmación:{" "}
                    {cancha.aprobacion_automatica ? "Automática" : "Manual"}
                  </p>
                  <p>{cancha.total_reservas} reservas acumuladas</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Reservas pendientes de aprobación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservas_pendientes_aprobacion.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay reservas pendientes por aprobar.
              </p>
            ) : (
              reservas_pendientes_aprobacion.map((reserva) => (
                <div
                  key={reserva._id}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {reserva.cancha_nombre}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {reserva.usuario.nombre_completo} · {reserva.usuario.email}
                      </p>
                      {reserva.usuario.telefono && (
                        <p className="text-sm text-gray-700">
                          📞 {reserva.usuario.telefono}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {reserva.fecha} · {reserva.hora_inicio} - {reserva.hora_fin}
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        Total: ${reserva.precio_total.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => void handleApproval(reserva._id, "aprobar")}
                        disabled={processingReservationId === reserva._id}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void handleApproval(reserva._id, "rechazar")}
                        disabled={processingReservationId === reserva._id}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservas recientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reservas_recientes.length === 0 ? (
            <p className="text-sm text-gray-500">No hay reservas recientes.</p>
          ) : (
            reservas_recientes.slice(0, 6).map((reserva) => (
              <div
                key={reserva._id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {reserva.cancha_nombre}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {reserva.usuario.nombre_completo}
                    {reserva.usuario.telefono && ` · 📞 ${reserva.usuario.telefono}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {reserva.fecha} · {reserva.hora_inicio} - {reserva.hora_fin}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${reserva.precio_total}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {reserva.estado}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
