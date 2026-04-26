"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import { timeToMinutes } from "@/lib/pricing";

interface ReservaCreada {
  _id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
}

interface CalendarioReservasProps {
  canchaId: string;
  onReservaCreated?: (reserva: ReservaCreada) => void;
  onSlotSelected?: (slot: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    precio: number;
  }) => void;
}

interface TimeSlot {
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
  estado?: string;
  precio: number;
}

interface DisponibilidadData {
  fecha: string;
  cancha_id: string;
  duracion_reserva: number;
  intervalo_reserva_minutos: number;
  horario_operacion?: {
    apertura: string;
    cierre: string;
  };
  horarios_disponibles: string[];
  horarios_disponibles_detalle: Array<{
    hora_inicio: string;
    hora_fin: string;
    precio_total: number;
    duracion_minutos: number;
  }>;
  horarios_ocupados: Array<{
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  }>;
  precio_por_hora: number;
  dias_operativos: string[];
  dia_actual: string;
  cerrado?: boolean;
  motivo?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-PY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

export function CalendarioReservas({
  canchaId,
  onSlotSelected,
}: CalendarioReservasProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  // Múltiplos del intervalo (1 = 1x intervalo, 2 = 2x, ..., 8 = 8x).
  // El usuario elige cuántos slots consecutivos reservar.
  const [duracionMultiplicador, setDuracionMultiplicador] = useState<number>(1);

  useEffect(() => {
    if (fechaSeleccionada && canchaId) {
      void cargarDisponibilidad(duracionMultiplicador);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada, canchaId, duracionMultiplicador]);

  const cargarDisponibilidad = async (multiplicador: number = 1) => {
    setLoading(true);
    setError(null);
    setSelectedSlot(null);

    try {
      // Primer fetch sin duracion para descubrir el intervalo de la cancha
      const intervalParam = disponibilidad?.intervalo_reserva_minutos
        ? `&duracion=${disponibilidad.intervalo_reserva_minutos * multiplicador}`
        : "";
      const response = await fetch(
        `/api/reservas/disponibilidad?cancha_id=${canchaId}&fecha=${fechaSeleccionada}${intervalParam}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al cargar disponibilidad");
      }

      setDisponibilidad(data.data.disponibilidad);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Error de conexión al cargar disponibilidad"
      );
    } finally {
      setLoading(false);
    }
  };

  const cambiarFecha = (direccion: "anterior" | "siguiente") => {
    const fecha = new Date(`${fechaSeleccionada}T00:00:00`);

    if (direccion === "anterior") {
      fecha.setDate(fecha.getDate() - 1);
    } else {
      fecha.setDate(fecha.getDate() + 1);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha >= hoy) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, "0");
      const day = String(fecha.getDate()).padStart(2, "0");
      setFechaSeleccionada(`${year}-${month}-${day}`);
    }
  };

  const generarTimeSlots = (): TimeSlot[] => {
    if (!disponibilidad || !disponibilidad.horario_operacion) return [];

    const slots: TimeSlot[] = [];
    const opening = timeToMinutes(disponibilidad.horario_operacion.apertura);
    const closing = timeToMinutes(disponibilidad.horario_operacion.cierre);
    const interval = disponibilidad.intervalo_reserva_minutos || 60;

    for (let minute = opening; minute < closing; minute += interval) {
      const horaInicio = minutesToTime(minute);
      const detalleDisponible = disponibilidad.horarios_disponibles_detalle.find(
        (slot) => slot.hora_inicio === horaInicio
      );
      const ocupado = disponibilidad.horarios_ocupados.find((slot) => {
        const ocupadoInicio = timeToMinutes(slot.hora_inicio);
        const ocupadoFin = timeToMinutes(slot.hora_fin);
        return minute >= ocupadoInicio && minute < ocupadoFin;
      });

      if (!detalleDisponible && !ocupado) {
        continue;
      }

      slots.push({
        hora_inicio: horaInicio,
        hora_fin:
          detalleDisponible?.hora_fin || minutesToTime(Math.min(minute + interval, closing)),
        disponible: Boolean(detalleDisponible),
        estado: ocupado?.estado,
        precio: detalleDisponible?.precio_total || 0,
      });
    }

    return slots;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.disponible) return;

    setSelectedSlot(slot);
    onSlotSelected?.({
      fecha: fechaSeleccionada,
      hora_inicio: slot.hora_inicio,
      hora_fin: slot.hora_fin,
      precio: slot.precio,
    });
  };

  const getSlotColor = (slot: TimeSlot) => {
    if (!slot.disponible) {
      if (slot.estado === "confirmada") {
        return "bg-red-100 text-red-800 border-red-200";
      }
      return "bg-gray-100 text-gray-500 border-gray-200";
    }

    if (selectedSlot?.hora_inicio === slot.hora_inicio) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200";
    }

    return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          Disponibilidad y reservas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cambiarFecha("anterior")}
            disabled={fechaSeleccionada <= new Date().toISOString().split("T")[0]}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatDate(fechaSeleccionada)}
            </h3>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(event) => setFechaSeleccionada(event.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 rounded border px-2 py-1 text-sm text-gray-700"
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => cambiarFecha("siguiente")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-2 text-gray-700">Cargando disponibilidad...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Día cerrado / cancha no opera */}
        {disponibilidad && !loading && !error && disponibilidad.cerrado && (
          <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Sin disponibilidad este día</p>
              <p className="text-amber-800">
                {disponibilidad.motivo || "La cancha no opera en la fecha seleccionada."}
              </p>
              <p className="text-amber-700 mt-1">
                Probá con otra fecha usando el calendario.
              </p>
            </div>
          </div>
        )}

        {/* Horarios disponibles */}
        {disponibilidad && !loading && !error && !disponibilidad.cerrado && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Horarios disponibles</h4>
              <Badge variant="outline" className="text-emerald-600">
                Intervalo {disponibilidad.intervalo_reserva_minutos} min
              </Badge>
            </div>

            {/* Selector de duración (múltiplos del intervalo) */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                ¿Cuánto querés reservar?
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((mult) => {
                  const totalMin = (disponibilidad.intervalo_reserva_minutos || 60) * mult;
                  const horas = Math.floor(totalMin / 60);
                  const mins = totalMin % 60;
                  const label = horas === 0
                    ? `${mins}min`
                    : mins === 0
                      ? `${horas}h`
                      : `${horas}h${mins}`;
                  const active = duracionMultiplicador === mult;
                  return (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setDuracionMultiplicador(mult)}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
                        active
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {generarTimeSlots().map((slot) => (
                <button
                  key={slot.hora_inicio}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.disponible}
                  className={`rounded-lg border p-3 transition-all duration-200 ${getSlotColor(
                    slot
                  )} ${!slot.disponible ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm font-medium">
                      {slot.hora_inicio}
                    </span>
                  </div>
                  <div className="mt-1 text-xs opacity-75">
                    {slot.disponible
                      ? `${formatPrice(slot.precio)}`
                      : slot.estado === "confirmada"
                      ? "Ocupado"
                      : "Pendiente"}
                  </div>
                </button>
              ))}
            </div>

            {selectedSlot && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-emerald-900">
                      Slot seleccionado: {selectedSlot.hora_inicio} - {selectedSlot.hora_fin}
                    </h5>
                    <p className="text-sm text-emerald-700">
                      Precio: {formatPrice(selectedSlot.precio)}
                    </p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Reservar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded border border-green-200 bg-green-50" />
                <span className="text-gray-700">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded border border-red-200 bg-red-100" />
                <span className="text-gray-700">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded border border-emerald-300 bg-emerald-100" />
                <span className="text-gray-700">Seleccionado</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
