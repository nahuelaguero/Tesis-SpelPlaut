"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
} from "lucide-react";

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
  disponible: boolean;
  estado?: string;
  precio?: number;
}

interface DisponibilidadData {
  fecha: string;
  cancha_id: string;
  duracion_reserva: number;
  horario_operacion: {
    apertura: string;
    cierre: string;
  };
  horarios_disponibles: string[];
  horarios_ocupados: Array<{
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  }>;
  precio_por_hora: number;
  dias_operativos: string[];
  dia_actual: string;
}

export function CalendarioReservas({
  canchaId,
  onSlotSelected,
}: CalendarioReservasProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    // Agregar un día para evitar problemas de zona horaria
    hoy.setDate(hoy.getDate() + 1);
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  });
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Cargar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (fechaSeleccionada && canchaId) {
      cargarDisponibilidad();
    }
  }, [fechaSeleccionada, canchaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDisponibilidad = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/reservas/disponibilidad?cancha_id=${canchaId}&fecha=${fechaSeleccionada}&duracion=60`
      );

      const data = await response.json();

      if (data.success) {
        setDisponibilidad(data.data.disponibilidad);
      } else {
        setError(data.message || "Error al cargar disponibilidad");
      }
    } catch {
      setError("Error de conexión al cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const cambiarFecha = (direccion: "anterior" | "siguiente") => {
    const fecha = new Date(fechaSeleccionada);

    if (direccion === "anterior") {
      fecha.setDate(fecha.getDate() - 1);
    } else {
      fecha.setDate(fecha.getDate() + 1);
    }

    // No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    if (fecha >= hoy) {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");
      setFechaSeleccionada(`${año}-${mes}-${dia}`);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generarTimeSlots = (): TimeSlot[] => {
    if (!disponibilidad) return [];

    const slots: TimeSlot[] = [];
    const horarioApertura = disponibilidad.horario_operacion.apertura;
    const horarioCierre = disponibilidad.horario_operacion.cierre;

    // Convertir horarios a minutos
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}`;
    };

    const inicio = timeToMinutes(horarioApertura);
    const fin = timeToMinutes(horarioCierre);

    // Generar slots de 1 hora
    for (let time = inicio; time < fin; time += 60) {
      const horaInicio = minutesToTime(time);
      const esDisponible =
        disponibilidad.horarios_disponibles.includes(horaInicio);

      // Buscar si está ocupado
      const ocupado = disponibilidad.horarios_ocupados.find(
        (slot) => slot.hora_inicio === horaInicio
      );

      slots.push({
        hora_inicio: horaInicio,
        disponible: esDisponible,
        estado: ocupado?.estado,
        precio: disponibilidad.precio_por_hora,
      });
    }

    return slots;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.disponible) {
      setSelectedSlot(slot.hora_inicio);

      // Calcular hora de fin (1 hora después)
      const [hours, minutes] = slot.hora_inicio.split(":").map(Number);
      const endHours = hours + 1;
      const hora_fin = `${endHours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      // Notificar al componente padre
      if (onSlotSelected && disponibilidad) {
        onSlotSelected({
          fecha: fechaSeleccionada,
          hora_inicio: slot.hora_inicio,
          hora_fin: hora_fin,
          precio: disponibilidad.precio_por_hora,
        });
      }

      console.log("Slot seleccionado:", slot);
    }
  };

  const getSlotColor = (slot: TimeSlot) => {
    if (!slot.disponible) {
      if (slot.estado === "confirmada") {
        return "bg-red-100 text-red-800 border-red-200";
      }
      return "bg-gray-100 text-gray-500 border-gray-200";
    }

    if (selectedSlot === slot.hora_inicio) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200";
    }

    return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          Disponibilidad y Reservas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selector de fecha */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cambiarFecha("anterior")}
            disabled={(() => {
              const hoy = new Date();
              const año = hoy.getFullYear();
              const mes = String(hoy.getMonth() + 1).padStart(2, "0");
              const dia = String(hoy.getDate()).padStart(2, "0");
              const fechaHoy = `${año}-${mes}-${dia}`;
              return fechaSeleccionada <= fechaHoy;
            })()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h3 className="font-semibold text-lg text-gray-900">
              {formatearFecha(fechaSeleccionada)}
            </h3>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              min={(() => {
                const hoy = new Date();
                const año = hoy.getFullYear();
                const mes = String(hoy.getMonth() + 1).padStart(2, "0");
                const dia = String(hoy.getDate()).padStart(2, "0");
                return `${año}-${mes}-${dia}`;
              })()}
              className="mt-1 px-2 py-1 border rounded text-sm text-gray-700"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => cambiarFecha("siguiente")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-2 text-gray-700 font-medium">
              Cargando disponibilidad...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Horarios disponibles */}
        {disponibilidad && !loading && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Horarios disponibles
              </h4>
              <Badge variant="outline" className="text-emerald-600">
                {formatPrice(disponibilidad.precio_por_hora)}/hora
              </Badge>
            </div>

            {/* Grid de slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {generarTimeSlots().map((slot) => (
                <button
                  key={slot.hora_inicio}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.disponible}
                  className={`
                    p-3 rounded-lg border transition-all duration-200
                    ${getSlotColor(slot)}
                    ${!slot.disponible ? "cursor-not-allowed opacity-60" : ""}
                  `}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm font-medium">
                      {slot.hora_inicio}
                    </span>
                  </div>

                  {slot.disponible && (
                    <div className="text-xs mt-1 opacity-75">Disponible</div>
                  )}

                  {!slot.disponible && slot.estado && (
                    <div className="text-xs mt-1 opacity-75">
                      {slot.estado === "confirmada" ? "Ocupado" : "Pendiente"}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Información adicional */}
            {selectedSlot && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-emerald-900">
                      Slot seleccionado: {selectedSlot}
                    </h5>
                    <p className="text-sm text-emerald-700">
                      Precio: {formatPrice(disponibilidad.precio_por_hora)}
                    </p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Reservar
                  </Button>
                </div>
              </div>
            )}

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                <span className="text-gray-700 font-medium">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-gray-700 font-medium">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div>
                <span className="text-gray-700 font-medium">Seleccionado</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
