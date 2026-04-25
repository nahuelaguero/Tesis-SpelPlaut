"use client";

import { useState, useEffect } from "react";
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
  Printer,
  AlertCircle,
} from "lucide-react";

interface ReporteData {
  ingresosMensuales: { mes: string; ingresos: number; reservas: number }[];
  canchasMasPopulares: {
    _id: string;
    nombre: string;
    reservas: number;
    ingresos: number;
  }[];
  estadisticasHorarios: { _id: string; reservas: number }[];
  resumenGeneral: {
    totalIngresos: number;
    totalReservas: number;
    promedioPorReserva: number;
    canchasMasActivas: number;
  };
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
  }).format(n);

export default function PropietarioReportesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ReporteData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [periodo, setPeriodo] = useState("3m");

  useEffect(() => {
    if (!loading && (!user || user.rol !== "propietario_cancha")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.rol !== "propietario_cancha") return;
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const r = await fetch(`/api/propietario/reportes?periodo=${periodo}`, {
          credentials: "include",
        });
        const j = await r.json();
        if (j.success) setData(j.data);
      } catch (e) {
        console.error("Error reporte:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user, periodo]);

  const exportarCSV = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push("Resumen general");
    lines.push("Total ingresos,Total reservas,Promedio por reserva,Canchas activas");
    const r = data.resumenGeneral;
    lines.push(
      `${r.totalIngresos},${r.totalReservas},${r.promedioPorReserva},${r.canchasMasActivas}`
    );
    lines.push("");
    lines.push("Ingresos mensuales");
    lines.push("Mes,Ingresos,Reservas");
    data.ingresosMensuales.forEach((m) =>
      lines.push(`${m.mes},${m.ingresos},${m.reservas}`)
    );
    lines.push("");
    lines.push("Canchas mas populares");
    lines.push("Cancha,Reservas,Ingresos");
    data.canchasMasPopulares.forEach((c) =>
      lines.push(`${c.nombre},${c.reservas},${c.ingresos}`)
    );
    lines.push("");
    lines.push("Horarios mas reservados");
    lines.push("Hora,Reservas");
    data.estadisticasHorarios.forEach((h) =>
      lines.push(`${h._id}:00,${h.reservas}`)
    );

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-propietario-${periodo}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    // Usa el dialogo de impresión del navegador (Guardar como PDF)
    window.print();
  };

  if (!user || user.rol !== "propietario_cancha") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
        `}</style>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push("/mi-cancha")}
                className="no-print"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <BarChart3 className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Reportes de tu Cancha
                </h1>
                <p className="text-gray-700 font-medium">
                  Estadísticas e ingresos del período seleccionado
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 no-print">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="1m">Último mes</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="1y">Último año</option>
              </select>
              <Button onClick={exportarCSV} variant="outline" disabled={!data}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={exportarPDF} variant="outline" disabled={!data}>
                <Printer className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>

        {loadingData && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
            <p className="mt-3 text-gray-600">Generando reporte...</p>
          </div>
        )}

        {!loadingData && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Ingresos Totales
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(data.resumenGeneral.totalIngresos)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Total Reservas
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.resumenGeneral.totalReservas}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Promedio por Reserva
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(data.resumenGeneral.promedioPorReserva)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Canchas Activas
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.resumenGeneral.canchasMasActivas}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 font-bold">
                  Ingresos por Mes
                </CardTitle>
                <CardDescription className="text-gray-700 font-medium">
                  Evolución del período seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.ingresosMensuales.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    Sin reservas en el período.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.ingresosMensuales.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{m.mes}</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {m.reservas} reservas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">
                            {formatPrice(m.ingresos)}
                          </p>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{
                                width: `${Math.max(
                                  10,
                                  (m.ingresos /
                                    Math.max(
                                      ...data.ingresosMensuales.map((x) => x.ingresos)
                                    )) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 font-bold">
                    Canchas Más Populares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.canchasMasPopulares.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">Sin datos.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.canchasMasPopulares.slice(0, 5).map((c, i) => (
                        <div
                          key={c._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-emerald-700">
                                {i + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{c.nombre}</p>
                              <p className="text-sm text-gray-700 font-medium">
                                {c.reservas} reservas
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900">
                            {formatPrice(c.ingresos)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 font-bold">
                    Horarios Más Reservados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.estadisticasHorarios.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">Sin datos.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.estadisticasHorarios.slice(0, 8).map((h) => (
                        <div
                          key={h._id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <span className="text-gray-900 font-medium">
                            {h._id}:00 hs
                          </span>
                          <span className="font-bold text-emerald-700">
                            {h.reservas} reservas
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
