"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
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
import { calculateReservationPrice } from "@/lib/pricing";
import { parseUbicacionACoords } from "@/lib/parse-ubicacion";
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
  // Reseñas
  const [resenas, setResenas] = useState<{ _id: string; calificacion: number; comentario: string; createdAt: string; usuario_id: { nombre_completo: string } }[]>([]);
  const [totalResenas, setTotalResenas] = useState(0);
  const [promedioResenas, setPromedioResenas] = useState<number | null>(null);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [resenaMsg, setResenaMsg] = useState("");

  // Coords reales del campo ubicacion (DMS o decimal); fallback a Loma Plata si no parseable.
  const parsedCoords = parseUbicacionACoords(cancha?.ubicacion);
  const canchaCoordinates = parsedCoords ?? {
    latitude: -22.3667,
    longitude: -59.85,
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

  // Propietarios y administradores no reservan: redirigir a sus paneles
  if (user && (user.rol === "propietario_cancha" || user.rol === "admin")) {
    const isAdmin = user.rol === "admin";
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Acceso restringido
            </h2>
            <p className="text-gray-700 mb-6">
              {isAdmin 
                ? "Los administradores no pueden hacer reservas." 
                : "Los propietarios de cancha no pueden hacer reservas. Solo pueden gestionar su propia cancha."}
            </p>
            <Button
              onClick={() => router.push(isAdmin ? "/admin" : "/mi-cancha")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ir a {isAdmin ? "Panel de Administración" : "Mi Cancha"}
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

          {/* Confirmación de reserva (solo lectura del slot + pago + notas) */}
          <Card id="formulario-reserva">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 font-bold">
                <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                Confirmar reserva
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Elegí un horario disponible arriba para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!fechaReserva || !horaInicio || !horaFin ? (
                <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-gray-600">
                  Seleccioná un horario en <span className="font-semibold">Disponibilidad y reservas</span> para ver el resumen y confirmar.
                </div>
              ) : (
                <form onSubmit={handleReservation} className="space-y-4">
                  {/* Resumen seleccionado (read-only) */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-800 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Horario seleccionado</span>
                    </div>
                    <div className="text-sm text-emerald-900 space-y-0.5">
                      <p>
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(fechaReserva + "T00:00:00").toLocaleDateString("es-PY", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p>
                        <span className="font-medium">Horario:</span> {horaInicio} - {horaFin}{" "}
                        ({calculateDuration().toFixed(1)} hora{calculateDuration() !== 1 ? "s" : ""})
                      </p>
                      <p>
                        <span className="font-medium">Precio/hora:</span>{" "}
                        {formatPrice(cancha.precio_por_hora)}
                      </p>
                      <p>
                        <span className="font-medium">Confirmación:</span>{" "}
                        {cancha.aprobacion_automatica === false
                          ? "Manual por el propietario"
                          : "Automática si el horario está libre"}
                      </p>
                      <p className="font-bold text-base mt-1">
                        Total: {formatPrice(calculateTotal())}
                      </p>
                    </div>
                  </div>

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
              )}
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
