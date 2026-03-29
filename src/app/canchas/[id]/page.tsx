"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/lib/geolocation";
import { calculateReservationPrice, timeToMinutes } from "@/lib/pricing";
import type { PrecioHorario } from "@/types";
import PaymentMethods from "@/components/PaymentMethods";
import { CalendarioReservas } from "@/components/reservas/CalendarioReservas";
import {
  MapPin,
  Star,
  Clock,
  Users,
  Calendar,
  DollarSign,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

interface Cancha {
  _id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  precio_por_hora: number;
  precio_desde?: number;
  precios_por_horario?: PrecioHorario[];
  capacidad_maxima: number;
  disponible: boolean;
  descripcion: string;
  servicios: string[];
  imagenes?: string[];
  horario_apertura: string;
  horario_cierre: string;
  intervalo_reserva_minutos?: number;
  aprobacion_automatica?: boolean;
  imagen_url?: string;
  valoracion?: number;
}

export default function CanchaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useGeolocation();
  const [cancha, setCancha] = useState<Cancha | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Estados del formulario de reserva
  const [fechaReserva, setFechaReserva] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [duracionSeleccionada, setDuracionSeleccionada] = useState<number>(0); // 0 = usa el intervalo default
  const [slotsDisponibles, setSlotsDisponibles] = useState<
    { hora_inicio: string; hora_fin: string; precio_total: number; duracion_minutos: number }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Reseñas
  const [resenas, setResenas] = useState<{ _id: string; calificacion: number; comentario: string; createdAt: string; usuario_id: { nombre_completo: string } }[]>([]);
  const [totalResenas, setTotalResenas] = useState(0);
  const [promedioResenas, setPromedioResenas] = useState<number | null>(null);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [resenaMsg, setResenaMsg] = useState("");

  // Coordenadas simuladas para Loma Plata (centro aproximado)
  const baseLatitude = -22.3667;
  const baseLongitude = -59.85;
  const canchaCoordinates = {
    latitude: baseLatitude + (Math.random() - 0.5) * 0.01,
    longitude: baseLongitude + (Math.random() - 0.5) * 0.01,
  };

  // Calcular distancia usando la fórmula de Haversine
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Calcular distancia si tenemos ubicación del usuario
  const distance = location?.coordinates
    ? calculateDistance(
        location.coordinates.latitude,
        location.coordinates.longitude,
        canchaCoordinates.latitude,
        canchaCoordinates.longitude
      )
    : undefined;

  const intervalo = cancha?.intervalo_reserva_minutos || 60;

  useEffect(() => {
    if (!fechaReserva || !cancha) {
      setSlotsDisponibles([]);
      setHoraInicio("");
      setHoraFin("");
      return;
    }
    const duracion = duracionSeleccionada || intervalo;
    setLoadingSlots(true);
    fetch(`/api/reservas/disponibilidad?cancha_id=${cancha._id}&fecha=${fechaReserva}&duracion=${duracion}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSlotsDisponibles(data.data.disponibilidad.horarios_disponibles_detalle || []);
        } else {
          setSlotsDisponibles([]);
        }
        setHoraInicio("");
        setHoraFin("");
      })
      .catch(() => setSlotsDisponibles([]))
      .finally(() => setLoadingSlots(false));
  }, [fechaReserva, cancha, duracionSeleccionada]);

  useEffect(() => {
    const fetchCancha = async () => {
      try {
        const response = await fetch(`/api/canchas/${params.id}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCancha(data.data.cancha);
            void fetchResenas(params.id as string);
          }
        } else {
          console.error("Error al obtener cancha:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar cancha:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCancha();
    }
  }, [params.id]);

  const fetchResenas = async (canchaId: string) => {
    const res = await fetch(`/api/resenas?cancha_id=${canchaId}`);
    const data = await res.json();
    if (data.success) {
      setResenas(data.data.resenas);
      setTotalResenas(data.data.total);
      setPromedioResenas(data.data.promedio);
    }
  };

  const handleEnviarResena = async () => {
    if (!nuevaCalificacion) return;
    setEnviandoResena(true);
    setResenaMsg("");
    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cancha_id: cancha?._id, calificacion: nuevaCalificacion, comentario: nuevoComentario }),
      });
      const data = await res.json();
      setResenaMsg(data.message);
      if (data.success && cancha) {
        setNuevaCalificacion(0);
        setNuevoComentario("");
        void fetchResenas(cancha._id);
      }
    } catch {
      setResenaMsg("Error al enviar la reseña.");
    } finally {
      setEnviandoResena(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateDuration = () => {
    if (!horaInicio || !horaFin) return 0;

    const [startHour, startMin] = horaInicio.split(":").map(Number);
    const [endHour, endMin] = horaFin.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) return 0;

    return (endMinutes - startMinutes) / 60;
  };

  const calculateTotal = () => {
    if (!cancha || !fechaReserva || !horaInicio || !horaFin) return 0;

    return calculateReservationPrice({
      cancha,
      fecha: fechaReserva,
      horaInicio,
      horaFin,
    }).total;
  };

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!fechaReserva || !horaInicio || !horaFin) {
      alert(
        "Por favor completa todos los campos obligatorios: fecha, hora de inicio y hora de fin"
      );
      return;
    }

    if (!metodoPago) {
      alert("Por favor selecciona un método de pago");
      return;
    }

    if (calculateDuration() <= 0) {
      alert("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    setReserving(true);

    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cancha_id: cancha?._id,
          fecha_reserva: fechaReserva,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          precio_total: calculateTotal(),
          metodo_pago: metodoPago,
          notas: notas || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReservationSuccess(true);
          // Limpiar formulario
          setFechaReserva("");
          setHoraInicio("");
          setHoraFin("");
          setNotas("");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error al crear reserva");
      }
    } catch (error) {
      console.error("Error al crear reserva:", error);
      alert("Error al procesar la reserva");
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Cargando detalles de la cancha...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!cancha) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Cancha no encontrada
            </h2>
            <Button
              onClick={() => router.push("/canchas")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Volver a canchas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (reservationSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Reserva creada exitosamente!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu reserva para {cancha.nombre} ha sido registrada. Revisa tus
              reservas para ver el estado.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => router.push("/mis-reservas")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Ver mis reservas
              </Button>
              <Button
                onClick={() => setReservationSuccess(false)}
                variant="outline"
              >
                Hacer otra reserva
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/canchas")}
            className="flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a canchas
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detalles de la cancha */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 font-medium"
                  >
                    {cancha.tipo}
                  </Badge>
                  {cancha.disponible && (
                    <Badge className="bg-emerald-100 text-emerald-800 font-semibold">
                      Disponible
                    </Badge>
                  )}
                </div>
                {cancha.valoracion && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-800">
                      {cancha.valoracion}
                    </span>
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {cancha.nombre}
              </CardTitle>
              <CardDescription className="flex items-center text-gray-700 font-medium">
                <MapPin className="h-4 w-4 mr-1" />
                {cancha.ubicacion}
                {distance && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    ({distance.toFixed(1)} km de distancia)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-800 font-medium">{cancha.descripcion}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-700 font-medium">
                    Hasta {cancha.capacidad_maxima} jugadores
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-700 font-medium">
                    {cancha.horario_apertura} - {cancha.horario_cierre}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-700 font-medium">
                    Desde {formatPrice(cancha.precio_desde || cancha.precio_por_hora)}/hora
                  </span>
                </div>
              </div>

              {cancha.servicios && cancha.servicios.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">
                    Servicios incluidos:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cancha.servicios.map((servicio, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-emerald-200 text-emerald-800 font-medium"
                      >
                        {servicio}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendario de reservas */}
          {cancha && (
            <CalendarioReservas
              canchaId={cancha._id}
              onReservaCreated={(reserva) => {
                console.log("Reserva creada:", reserva);
                setReservationSuccess(true);
              }}
              onSlotSelected={(slot) => {
                // Auto-completar formulario cuando se selecciona un slot del calendario
                setFechaReserva(slot.fecha);
                // horaInicio/horaFin se setean después de que el useEffect carga los slots
                // Guardamos los valores para pre-seleccionar el slot correcto
                setHoraInicio(slot.hora_inicio);
                setHoraFin(slot.hora_fin);

                // Scroll suave hacia el formulario
                const formulario =
                  document.getElementById("formulario-reserva");
                if (formulario) {
                  formulario.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
            />
          )}

          {/* Formulario de reserva integrado */}
          <Card id="formulario-reserva">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 font-bold">
                <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                Confirmar reserva
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Selecciona un horario arriba o completa los datos manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Indicador de slot seleccionado */}
              {fechaReserva && horaInicio && horaFin && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">
                      Horario seleccionado: {horaInicio} - {horaFin} del{" "}
                      {new Date(fechaReserva).toLocaleDateString("es-PY", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleReservation} className="space-y-4">
                <div>
                  <Label htmlFor="fecha">Fecha de reserva *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fechaReserva}
                    onChange={(e) => setFechaReserva(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    placeholder="dd/mm/aaaa"
                    pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                    className="cursor-pointer"
                    onFocus={(e) =>
                      e.target.showPicker && e.target.showPicker()
                    }
                  />
                </div>

                {/* Selector de duración */}
                <div>
                  <Label>Duración *</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.from({ length: Math.min(8, Math.floor((timeToMinutes(cancha.horario_cierre) - timeToMinutes(cancha.horario_apertura)) / intervalo)) }, (_, i) => (i + 1) * intervalo).map((mins) => {
                      const horas = Math.floor(mins / 60);
                      const minutos = mins % 60;
                      const label = horas > 0
                        ? minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`
                        : `${mins}min`;
                      const selected = (duracionSeleccionada || intervalo) === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => { setDuracionSeleccionada(mins); setHoraInicio(""); setHoraFin(""); }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                            selected
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

                <div>
                  <Label htmlFor="slot-selector">Horario disponible *</Label>
                  {!fechaReserva ? (
                    <p className="text-sm text-gray-500 mt-1">Seleccioná una fecha primero.</p>
                  ) : loadingSlots ? (
                    <p className="text-sm text-gray-500 mt-1">Cargando horarios...</p>
                  ) : slotsDisponibles.length === 0 ? (
                    <p className="text-sm text-red-500 mt-1">No hay horarios disponibles para esta fecha.</p>
                  ) : (
                    <select
                      id="slot-selector"
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={horaInicio ? `${horaInicio}|${horaFin}` : ""}
                      onChange={(e) => {
                        const [inicio, fin] = e.target.value.split("|");
                        setHoraInicio(inicio || "");
                        setHoraFin(fin || "");
                      }}
                      required
                    >
                      <option value="">-- Elegí un horario --</option>
                      {slotsDisponibles.map((slot) => (
                        <option key={slot.hora_inicio} value={`${slot.hora_inicio}|${slot.hora_fin}`}>
                          {slot.hora_inicio} – {slot.hora_fin} ({slot.duracion_minutos} min) — {formatPrice(slot.precio_total)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Método de pago */}
                <div>
                  <Label htmlFor="metodo-pago">Método de pago *</Label>
                  <PaymentMethods
                    amount={calculateTotal()}
                    selectedMethod={metodoPago}
                    onPaymentSelect={setMetodoPago}
                  />
                </div>

                <div>
                  <Label htmlFor="notas">Comentarios (opcional)</Label>
                  <Textarea
                    id="notas"
                    placeholder="Información adicional para tu reserva... (ej: número de jugadores, solicitudes especiales)"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {notas.length}/500 caracteres
                  </p>
                </div>

                {/* Resumen */}
                {horaInicio && horaFin && (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-emerald-800 mb-2">
                      Resumen de la reserva:
                    </h3>
                    <div className="space-y-1 text-sm text-emerald-700">
                      <p>
                        Duración: {calculateDuration().toFixed(1)} hora
                        {calculateDuration() !== 1 ? "s" : ""}
                      </p>
                      <p>
                        Precio base: {formatPrice(cancha.precio_por_hora)}
                      </p>
                      <p>
                        Intervalo permitido: {cancha.intervalo_reserva_minutos || 60} minutos
                      </p>
                      <p>
                        Confirmación:{" "}
                        {cancha.aprobacion_automatica === false
                          ? "Manual por el propietario"
                          : "Automática si el horario está libre"}
                      </p>
                      <p className="font-bold text-lg">
                        Total estimado: {formatPrice(calculateTotal())}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={reserving || !user}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {reserving
                    ? "Procesando..."
                    : user
                      ? "Confirmar reserva"
                      : "Inicia sesión para reservar"}
                </Button>

                {!user && (
                  <p className="text-sm text-gray-700 font-medium text-center">
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="text-emerald-600 hover:text-emerald-700 underline font-semibold"
                    >
                      Inicia sesión
                    </button>{" "}
                    para poder hacer reservas
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sección de reseñas */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-bold">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                Reseñas
                {totalResenas > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({promedioResenas} ★ · {totalResenas} reseña{totalResenas !== 1 ? "s" : ""})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulario para dejar reseña */}
              {user && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <p className="font-medium text-gray-800 text-sm">Dejá tu reseña</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNuevaCalificacion(star)}
                        className="text-2xl leading-none"
                      >
                        <Star className={`h-6 w-6 ${star <= nuevaCalificacion ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Comentario (opcional)"
                    maxLength={500}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button
                    onClick={() => void handleEnviarResena()}
                    disabled={enviandoResena || !nuevaCalificacion}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {enviandoResena ? "Enviando..." : "Enviar reseña"}
                  </Button>
                  {resenaMsg && (
                    <p className={`text-sm ${resenaMsg.includes("exitosamente") ? "text-emerald-600" : "text-red-500"}`}>
                      {resenaMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Lista de reseñas */}
              {resenas.length === 0 ? (
                <p className="text-gray-500 text-sm">Aún no hay reseñas para esta cancha.</p>
              ) : (
                <div className="space-y-4">
                  {resenas.map((resena) => (
                    <div key={resena._id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= resena.calificacion ? "text-yellow-400 fill-current" : "text-gray-200"}`} />
                          ))}
                        </div>
                        <span className="font-medium text-sm text-gray-800">
                          {resena.usuario_id?.nombre_completo || "Usuario"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(resena.createdAt).toLocaleDateString("es-PY")}
                        </span>
                      </div>
                      {resena.comentario && (
                        <p className="text-sm text-gray-600">{resena.comentario}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
