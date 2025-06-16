"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Header from "@/components/layout/Header";

interface Reserva {
  _id: string;
  usuario_id: {
    _id: string;
    nombre_completo: string;
    email: string;
    telefono: string;
  };
  cancha_id: {
    _id: string;
    nombre: string;
    ubicacion: string;
  };
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  fecha_reserva: string;
}

export default function AdminReservasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todas");
  const [message, setMessage] = useState("");

  // Verificar permisos
  useEffect(() => {
    if (!loading && (!user || user.rol !== "admin")) {
      router.push("/");
      return;
    }

    if (user && user.rol === "admin") {
      loadReservas();
    }
  }, [user, loading, router]);

  const loadReservas = async () => {
    try {
      const response = await fetch("/api/admin/reservas", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReservas(data.data.reservas || []);
        } else {
          setMessage(data.message || "Error al cargar reservas");
        }
      } else {
        setMessage("Error al obtener reservas");
      }
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setMessage("Error de conexión al cargar reservas");
    } finally {
      setLoadingReservas(false);
    }
  };

  const handleEstadoChange = async (reservaId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/admin/reservas/${reservaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        setMessage(`Estado de reserva actualizado a ${nuevoEstado}`);
        await loadReservas(); // Recargar datos
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error al actualizar estado de reserva");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error de conexión");
    }
  };

  const filteredReservas = reservas.filter((reserva) => {
    const matchesSearch =
      reserva.usuario_id.nombre_completo
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reserva.cancha_id.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reserva.usuario_id.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado =
      filterEstado === "todas" || reserva.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      pendiente: "bg-yellow-100 text-yellow-800",
      confirmada: "bg-green-100 text-green-800",
      cancelada: "bg-red-100 text-red-800",
      completada: "bg-blue-100 text-blue-800",
    };

    const icons = {
      pendiente: <AlertTriangle className="h-3 w-3" />,
      confirmada: <CheckCircle className="h-3 w-3" />,
      cancelada: <XCircle className="h-3 w-3" />,
      completada: <CheckCircle className="h-3 w-3" />,
    };

    const labels = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      cancelada: "Cancelada",
      completada: "Completada",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          styles[estado as keyof typeof styles]
        }`}
      >
        {icons[estado as keyof typeof icons]}
        <span className="ml-1">{labels[estado as keyof typeof labels]}</span>
      </span>
    );
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
            <p className="text-gray-600">
              Solo los administradores pueden acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || loadingReservas) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <Button
                variant="outline"
                onClick={() => router.push("/admin")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Calendar className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Gestión de Reservas
                </h1>
                <p className="text-gray-600">
                  Administra todas las reservas del sistema
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700">{message}</p>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por usuario, cancha o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todas">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">
                {reservas.length}
              </div>
              <p className="text-sm text-gray-600">Total reservas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {reservas.filter((r) => r.estado === "pendiente").length}
              </div>
              <p className="text-sm text-gray-600">Pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {reservas.filter((r) => r.estado === "confirmada").length}
              </div>
              <p className="text-sm text-gray-600">Confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600">
                {formatPrice(
                  reservas.reduce((sum, r) => sum + r.precio_total, 0)
                )}
              </div>
              <p className="text-sm text-gray-600">Ingresos totales</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de reservas */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReservas.map((reserva) => (
            <Card
              key={reserva._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {reserva.cancha_id.nombre}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {reserva.cancha_id.ubicacion}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(reserva.estado)}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <div>
                      <span className="font-medium">
                        {reserva.usuario_id.nombre_completo}
                      </span>
                      <br />
                      <span className="text-xs">
                        {reserva.usuario_id.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(reserva.fecha)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {reserva.hora_inicio} - {reserva.hora_fin}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-lg font-bold text-emerald-600">
                      {formatPrice(reserva.precio_total)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Reservado: {formatDate(reserva.fecha_reserva)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cambiar Estado:
                    </label>
                    <select
                      value={reserva.estado}
                      onChange={(e) =>
                        handleEstadoChange(reserva._id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReservas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || filterEstado !== "todas"
                  ? "No se encontraron reservas con los filtros aplicados"
                  : "No hay reservas registradas"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
