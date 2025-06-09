"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Calendar,
  MapPin,
  Download,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";

// Lazy load the chart components
const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface ReporteData {
  ingresosMensuales: {
    mes: string;
    ingresos: number;
    reservas: number;
  }[];
  canchasMasPopulares: {
    _id: string;
    nombre: string;
    reservas: number;
    ingresos: number;
  }[];
  estadisticasHorarios: {
    _id: string;
    reservas: number;
  }[];
  resumenGeneral: {
    totalIngresos: number;
    totalReservas: number;
    promedioPorReserva: number;
    canchasMasActivas: number;
  };
}

export default function ReportesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reporteData, setReporteData] = useState<ReporteData | null>(null);
  const [loadingReporte, setLoadingReporte] = useState(true);
  const [periodo, setPeriodo] = useState("3m"); // 1m, 3m, 6m, 1y

  // Verificar permisos
  useEffect(() => {
    if (!loading && (!user || user.rol !== "admin")) {
      router.push("/");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchReporte = async () => {
      if (!user || user.rol !== "admin") return;

      try {
        setLoadingReporte(true);
        const response = await fetch(`/api/admin/reportes?periodo=${periodo}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReporteData(data.data);
          }
        } else {
          console.error("Error al obtener reporte:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar reporte:", error);
      } finally {
        setLoadingReporte(false);
      }
    };

    if (user && user.rol === "admin") {
      fetchReporte();
    }
  }, [user, periodo]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const exportarReporte = async () => {
    try {
      const response = await fetch(
        `/api/admin/reportes/export?periodo=${periodo}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte-spelplaut-${periodo}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error al exportar reporte:", error);
    }
  };

  // Verificar permisos
  if (!user || user.rol !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-700">
              Solo los administradores pueden acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => router.push("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <BarChart3 className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Reportes y Análisis
                </h1>
                <p className="text-gray-700 font-medium">
                  Insights y estadísticas detalladas de tu negocio
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
              >
                <option value="1m">Último mes</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="1y">Último año</option>
              </select>
              <Button
                onClick={exportarReporte}
                variant="outline"
                className="px-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingReporte && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ChartSkeleton />
          </div>
        )}

        {/* Contenido principal */}
        {!loadingReporte && reporteData && (
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Ingresos Totales
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(reporteData.resumenGeneral.totalIngresos)}
                  </div>
                  <p className="text-xs text-gray-800 font-medium">
                    período seleccionado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Total Reservas
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {reporteData.resumenGeneral.totalReservas}
                  </div>
                  <p className="text-xs text-gray-800 font-medium">
                    reservas completadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Promedio por Reserva
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(reporteData.resumenGeneral.promedioPorReserva)}
                  </div>
                  <p className="text-xs text-gray-800 font-medium">
                    valor promedio
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Canchas Activas
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {reporteData.resumenGeneral.canchasMasActivas}
                  </div>
                  <p className="text-xs text-gray-800 font-medium">
                    con reservas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de ingresos mensuales */}
            <Suspense fallback={<ChartSkeleton />}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 font-bold">
                    Ingresos por Mes
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    Evolución de ingresos y número de reservas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reporteData.ingresosMensuales.map((mes, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{mes.mes}</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {mes.reservas} reservas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">
                            {formatPrice(mes.ingresos)}
                          </p>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{
                                width: `${Math.max(
                                  10,
                                  (mes.ingresos /
                                    Math.max(
                                      ...reporteData.ingresosMensuales.map(
                                        (m) => m.ingresos
                                      )
                                    )) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Suspense>

            {/* Top canchas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900 font-bold">
                      Canchas Más Populares
                    </CardTitle>
                    <CardDescription className="text-gray-700 font-medium">
                      Ranking por número de reservas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reporteData.canchasMasPopulares
                        .slice(0, 5)
                        .map((cancha, index) => (
                          <div
                            key={cancha._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-emerald-700">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {cancha.nombre}
                                </p>
                                <p className="text-sm text-gray-700 font-medium">
                                  {cancha.reservas} reservas
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {formatPrice(cancha.ingresos)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </Suspense>

              {/* Horarios más populares */}
              <Suspense fallback={<ChartSkeleton />}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900 font-bold">
                      Horarios Más Solicitados
                    </CardTitle>
                    <CardDescription className="text-gray-700 font-medium">
                      Franjas horarias con más reservas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reporteData.estadisticasHorarios
                        .slice(0, 5)
                        .map((horario) => (
                          <div
                            key={horario._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-bold text-gray-900">
                                {horario._id}:00
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-700 font-medium">
                                {horario.reservas} reservas
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (horario.reservas /
                                        Math.max(
                                          ...reporteData.estadisticasHorarios.map(
                                            (h) => h.reservas
                                          )
                                        )) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </Suspense>
            </div>
          </div>
        )}

        {/* Estado sin datos */}
        {!loadingReporte && !reporteData && (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos disponibles
              </h3>
              <p className="text-gray-700">
                No se encontraron datos para el período seleccionado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
