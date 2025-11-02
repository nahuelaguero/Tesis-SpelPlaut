"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Settings,
} from "lucide-react";

interface DisponibilidadItem {
  fecha: string;
  disponible: boolean;
  motivo?: string;
}

export default function DisponibilidadPage() {
  const { user } = useAuth();
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [canchaId, setCanchaId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (user && (user.rol === "propietario_cancha" || user.rol === "admin")) {
      loadDisponibilidad();
    }
  }, [user]);

  const loadDisponibilidad = async () => {
    try {
      // Primero obtener la cancha del usuario
      const canchaResponse = await fetch("/api/canchas/mi-cancha", {
        credentials: "include",
      });

      if (!canchaResponse.ok) {
        throw new Error("Error obteniendo información de la cancha");
      }

      const canchaData = await canchaResponse.json();
      if (!canchaData.success || !canchaData.data) {
        throw new Error("No se encontró información de la cancha");
      }

      const miCanchaId = canchaData.data._id;
      setCanchaId(miCanchaId);

      // Luego obtener la disponibilidad
      const response = await fetch(`/api/canchas/${miCanchaId}/disponibilidad`);

      if (!response.ok) {
        throw new Error("Error cargando disponibilidad");
      }

      const data = await response.json();
      if (data.success) {
        setDisponibilidad(data.data.disponibilidad || []);
      } else {
        setMessage(data.message || "Error cargando disponibilidad");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error de conexión al cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canchaId) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/canchas/${canchaId}/disponibilidad`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fecha: selectedDate,
          disponible: isAvailable,
          motivo: !isAvailable ? motivo : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Disponibilidad actualizada exitosamente");
        setDialogOpen(false);
        setSelectedDate("");
        setMotivo("");
        setIsAvailable(true);
        // Recargar datos
        await loadDisponibilidad();
      } else {
        setMessage(data.message || "Error actualizando disponibilidad");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const eliminarDisponibilidad = async (fecha: string) => {
    if (!canchaId) return;

    try {
      const response = await fetch(`/api/canchas/${canchaId}/disponibilidad`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fecha,
          disponible: true, // Restaurar a disponible
        }),
      });

      if (response.ok) {
        await loadDisponibilidad();
        setMessage("Disponibilidad restaurada");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error eliminando restricción");
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Verificar permisos
  if (!user || (user.rol !== "propietario_cancha" && user.rol !== "admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              Solo los propietarios de canchas pueden acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Disponibilidad
            </h1>
          </div>
          <p className="text-gray-600">
            Configura los días en que tu cancha no está disponible para
            reservas.
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.includes("exitosamente") || message.includes("restaurada")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.includes("exitosamente") ||
            message.includes("restaurada") ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Panel de control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Configurar Disponibilidad</span>
              </CardTitle>
              <CardDescription>
                Marca los días en que tu cancha no estará disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agregar Restricción de Fecha
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurar Disponibilidad</DialogTitle>
                    <DialogDescription>
                      Selecciona una fecha y configura su disponibilidad
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Estado de Disponibilidad</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="disponible"
                            name="disponibilidad"
                            checked={isAvailable}
                            onChange={() => setIsAvailable(true)}
                            disabled={submitting}
                            className="text-emerald-600"
                          />
                          <Label
                            htmlFor="disponible"
                            className="text-emerald-700"
                          >
                            Disponible (predeterminado)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="no-disponible"
                            name="disponibilidad"
                            checked={!isAvailable}
                            onChange={() => setIsAvailable(false)}
                            disabled={submitting}
                            className="text-red-600"
                          />
                          <Label
                            htmlFor="no-disponible"
                            className="text-red-700"
                          >
                            No disponible
                          </Label>
                        </div>
                      </div>
                    </div>

                    {!isAvailable && (
                      <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo (opcional)</Label>
                        <Textarea
                          id="motivo"
                          placeholder="Ej: Mantenimiento, evento privado, reparaciones..."
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          disabled={submitting}
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={submitting}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !selectedDate}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Lista de restricciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Restricciones Activas</span>
              </CardTitle>
              <CardDescription>
                Fechas con disponibilidad configurada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disponibilidad.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay restricciones configuradas
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tu cancha está disponible todos los días según tus horarios
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {disponibilidad
                    .filter((item) => !item.disponible)
                    .map((item) => (
                      <div
                        key={item.fecha}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-red-900">
                            {formatearFecha(item.fecha)}
                          </p>
                          {item.motivo && (
                            <p className="text-sm text-red-700 mt-1">
                              {item.motivo}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarDisponibilidad(item.fecha)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  ✅ Días Disponibles
                </h4>
                <p className="text-sm text-gray-600">
                  Los usuarios pueden hacer reservas según tus horarios
                  configurados.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  ❌ Días No Disponibles
                </h4>
                <p className="text-sm text-gray-600">
                  Los usuarios no podrán reservar en estas fechas,
                  independientemente de los horarios.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  🔄 Reservas Existentes
                </h4>
                <p className="text-sm text-gray-600">
                  Las reservas ya confirmadas no se verán afectadas por los
                  cambios de disponibilidad.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">📧 Notificaciones</h4>
                <p className="text-sm text-gray-600">
                  Los usuarios con reservas en fechas restringidas recibirán
                  notificaciones automáticas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
