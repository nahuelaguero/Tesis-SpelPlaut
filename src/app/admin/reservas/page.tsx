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
import { formatCurrencyPYG, formatDateSafe, safeText, toSafeNumber } from "@/lib/safe-format";

interface Reserva {
  _id: string;
  usuario_id?: {
    _id: string;
    nombre_completo?: string | null;
    email?: string | null;
    telefono?: string | null;
  } | null;
  cancha_id?: {
    _id: string;
    nombre?: string | null;
    ubicacion?: string | null;
  } | null;
  fecha?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  precio_total?: number | null;
  estado?: string | null;
  fecha_reserva?: string | null;
}

const ESTADO_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pendiente_aprobacion", label: "Por Aprobar" },
  { value: "confirmada", label: "Confirmada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "rechazada", label: "Rechazada" },
] as const;

const ESTADO_META = {
  pendiente: {
    className: "bg-yellow-100 text-yellow-800",
    label: "Pendiente",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  pendiente_aprobacion: {
    className: "bg-orange-100 text-orange-800",
    label: "Por Aprobar",
    icon: <Clock className="h-3 w-3" />,
  },
  confirmada: {
    className: "bg-green-100 text-green-800",
    label: "Confirmada",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  cancelada: {
    className: "bg-red-100 text-red-800",
    label: "Cancelada",
    icon: <XCircle className="h-3 w-3" />,
  },
  completada: {
    className: "bg-blue-100 text-blue-800",
    label: "Completada",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  rechazada: {
    className: "bg-rose-100 text-rose-800",
    label: "Rechazada",
    icon: <XCircle className="h-3 w-3" />,
  },
};

type ReservaEstado = keyof typeof ESTADO_META;

function getKnownEstado(estado: unknown): ReservaEstado | null {
  if (typeof estado !== "string") return null;
  return estado in ESTADO_META ? (estado as ReservaEstado) : null;
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
          setReservas(Array.isArray(data.data?.reservas) ? data.data.reservas : []);
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
    const search = searchTerm.toLowerCase();
    const usuarioNombre = safeText(reserva.usuario_id?.nombre_completo, "");
    const usuarioEmail = safeText(reserva.usuario_id?.email, "");
    const canchaNombre = safeText(reserva.cancha_id?.nombre, "");

    const matchesSearch =
      usuarioNombre.toLowerCase().includes(search) ||
      canchaNombre.toLowerCase().includes(search) ||
      usuarioEmail.toLowerCase().includes(search);

    const matchesEstado =
      filterEstado === "todas" || reserva.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  const getEstadoBadge = (estado: string) => {
    const knownEstado = getKnownEstado(estado);
    const meta = knownEstado ? ESTADO_META[knownEstado] : null;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          meta?.className || "bg-gray-100 text-gray-800"
        }`}
      >
        {meta?.icon || <AlertCircle className="h-3 w-3" />}
        <span className="ml-1">{meta?.label || "Estado desconocido"}</span>
      </span>
    );
  };

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
              {ESTADO_OPTIONS.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
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
                {formatCurrencyPYG(
                  reservas.reduce((sum, r) => sum + toSafeNumber(r.precio_total), 0)
                )}
              </div>
              <p className="text-sm text-gray-600">Ingresos totales</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de reservas */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReservas.map((reserva, index) => (
            <Card
              key={reserva._id || `reserva-${index}`}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {safeText(reserva.cancha_id?.nombre, "Cancha no disponible")}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {safeText(reserva.cancha_id?.ubicacion, "Ubicación no disponible")}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(reserva.estado || "")}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <div>
                      <span className="font-medium">
                        {safeText(reserva.usuario_id?.nombre_completo, "Usuario no disponible")}
                      </span>
                      <br />
                      <span className="text-xs">
                        {safeText(reserva.usuario_id?.email, "Email no disponible")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDateSafe(reserva.fecha)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {safeText(reserva.hora_inicio, "--:--")} - {safeText(reserva.hora_fin, "--:--")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrencyPYG(reserva.precio_total)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Reservado: {formatDateSafe(reserva.fecha_reserva)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cambiar Estado:
                    </label>
                    <select
                      value={getKnownEstado(reserva.estado) || "desconocido"}
                      onChange={(e) =>
                        handleEstadoChange(reserva._id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {!getKnownEstado(reserva.estado) && (
                        <option value="desconocido" disabled>
                          Estado desconocido
                        </option>
                      )}
                      {ESTADO_OPTIONS.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
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
