"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Star,
} from "lucide-react";

interface Reserva {
  _id: string;
  cancha_id?: {
    _id: string;
    nombre: string;
    ubicacion: string;
    precio_por_hora?: number;
  } | null;
  usuario_id?: {
    _id: string;
    nombre_completo: string;
    email: string;
  } | null;
  fecha: string; // YYYY-MM-DD string
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_horas: number;
  precio_total: number;
  estado: "confirmada" | "pendiente" | "pendiente_aprobacion" | "cancelada" | "completada";
  metodo_pago?: string;
  pagado: boolean;
  createdAt?: string;
  notas?: string;
}

export default function MisReservasPage() {
  const { user, loading } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [editForm, setEditForm] = useState({
    fecha_reserva: "",
    hora_inicio: "",
    hora_fin: "",
    notas: "",
  });
  const [reviewReserva, setReviewReserva] = useState<Reserva | null>(null);
  const [reviewForm, setReviewForm] = useState({
    calificacion: 5,
    comentario: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    const fetchReservas = async () => {
      if (!user) return;

      try {
        const endpoint = "/api/reservas";
        const response = await fetch(endpoint, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReservas(
              Array.isArray(data.data?.reservas) ? data.data.reservas : []
            );
          }
        } else {
          console.error("Error al obtener reservas:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar reservas:", error);
      } finally {
        setLoadingReservas(false);
      }
    };

    if (user) {
      fetchReservas();
    }
  }, [user, loading, router]);

  const handleCancelReservation = async (reservaId: string) => {
    setActionLoading(reservaId);
    try {
      const response = await fetch(`/api/reservas/${reservaId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Actualizar el estado local
          setReservas(
            reservas.map((reserva) =>
              reserva._id === reservaId
                ? { ...reserva, estado: "cancelada" as const }
                : reserva
            )
          );
          alert("Reserva cancelada exitosamente");
        } else {
          alert(data.message || "Error al cancelar reserva");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error al cancelar reserva");
      }
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      alert("Error al procesar la cancelación");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (reserva: Reserva) => {
    setEditingReserva(reserva);
    const fechaISO = getReservaDateString(reserva);
    setEditForm({
      fecha_reserva: fechaISO,
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      notas: reserva.notas || "",
    });
  };

  const handleEditReservation = async () => {
    if (!editingReserva) return;

    // Validaciones básicas
    if (
      !editForm.fecha_reserva ||
      !editForm.hora_inicio ||
      !editForm.hora_fin
    ) {
      alert("Todos los campos de fecha y hora son obligatorios");
      return;
    }

    // Validar que la fecha sea futura
    const today = new Date().toISOString().split("T")[0];
    if (editForm.fecha_reserva < today) {
      alert("No se pueden programar reservas para fechas pasadas");
      return;
    }

    // Validar horarios
    const [inicioHour, inicioMin] = editForm.hora_inicio.split(":").map(Number);
    const [finHour, finMin] = editForm.hora_fin.split(":").map(Number);
    const inicioMinutos = inicioHour * 60 + inicioMin;
    const finMinutos = finHour * 60 + finMin;

    if (finMinutos <= inicioMinutos) {
      alert("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    if (finMinutos - inicioMinutos < 30) {
      alert("La reserva debe ser de al menos 30 minutos");
      return;
    }

    setActionLoading(editingReserva._id);

    try {
      // Calcular nueva duración y precio
      const duracion_horas = (finMinutos - inicioMinutos) / 60;
      const precio_hora = editingReserva.cancha_id?.precio_por_hora || 80000;
      const nuevo_precio = duracion_horas * precio_hora;

      const response = await fetch(`/api/reservas/${editingReserva._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fecha_reserva: editForm.fecha_reserva,
          hora_inicio: editForm.hora_inicio,
          hora_fin: editForm.hora_fin,
          duracion_horas,
          precio_total: nuevo_precio,
          notas: editForm.notas,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Actualizar el estado local
          setReservas(
            reservas.map((reserva) =>
              reserva._id === editingReserva._id ? data.data.reserva : reserva
            )
          );
          setEditingReserva(null);
          alert("Reserva modificada exitosamente");
        } else {
          alert(data.message || "Error al modificar reserva");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error al modificar reserva");
      }
    } catch (error) {
      console.error("Error al modificar reserva:", error);
      alert("Error al procesar la modificación");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewReserva) return;
    if (!reviewReserva.cancha_id?._id) {
      alert("No se puede enviar reseña: cancha no disponible.");
      return;
    }

    setActionLoading(reviewReserva._id);
    try {
      const response = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cancha_id: reviewReserva.cancha_id._id,
          calificacion: reviewForm.calificacion,
          comentario: reviewForm.comentario,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("¡Reseña enviada exitosamente!");
        setReviewReserva(null);
        setReviewForm({ calificacion: 5, comentario: "" });
      } else {
        alert(data.message || "Error al enviar reseña");
      }
    } catch (error) {
      console.error("Error al enviar reseña:", error);
      alert("Error de conexión al enviar reseña");
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Fecha no disponible";
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (estado: string, pagado: boolean) => {
    switch (estado) {
      case "confirmada":
        return pagado
          ? "bg-emerald-100 text-emerald-800"
          : "bg-blue-100 text-blue-800";
      case "pendiente":
      case "pendiente_aprobacion":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (estado: string, pagado: boolean) => {
    if (estado === "confirmada" && pagado) return "Confirmada y Pagada";
    if (estado === "confirmada" && !pagado) return "Confirmada";
    if (estado === "pendiente") return "Pendiente";
    if (estado === "pendiente_aprobacion") return "Pendiente de Aprobación";
    if (estado === "cancelada") return "Cancelada";
    return estado;
  };

  const getReservaDateString = (reserva: Reserva): string => {
    // Use the YYYY-MM-DD string field, fallback to parsing fecha_reserva
    if (reserva.fecha && /^\d{4}-\d{2}-\d{2}$/.test(reserva.fecha)) return reserva.fecha;
    return reserva.fecha_reserva?.slice(0, 10) || "";
  };

  const getCanchaName = (reserva: Reserva) =>
    reserva.cancha_id?.nombre || "Cancha no disponible";

  const getCanchaLocation = (reserva: Reserva) =>
    reserva.cancha_id?.ubicacion || "Ubicación no disponible";

  const getCreatedAtLabel = (reserva: Reserva) => {
    const source = reserva.createdAt || reserva.fecha_reserva;
    if (!source) return "Fecha de creación no disponible";
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return "Fecha de creación no disponible";
    return parsed.toLocaleDateString("es-ES");
  };

  const canCancelReservation = (reserva: Reserva) => {
    if (reserva.estado === "cancelada") return false;
    if (reserva.estado === "confirmada" && reserva.pagado) return false;

    const dateStr = getReservaDateString(reserva);
    if (!dateStr) return false;
    const now = new Date();
    const reservaDateTime = new Date(`${dateStr}T${reserva.hora_inicio}`);
    const timeDiff = reservaDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff > 2;
  };

  const canEditReservation = (reserva: Reserva) => {
    if (reserva.estado === "cancelada") return false;
    if (reserva.estado === "confirmada" && reserva.pagado) return false;

    const dateStr = getReservaDateString(reserva);
    if (!dateStr) return false;
    const now = new Date();
    const reservaDateTime = new Date(`${dateStr}T${reserva.hora_inicio}`);
    const timeDiff = reservaDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff > 2;
  };

  if (loading || loadingReservas) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-600" />
            <p className="mt-4 text-gray-700 font-medium">
              Cargando tus reservas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Se redirige en el useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold">
              {user.rol === "admin" ? "Todas las Reservas" : "Mis Reservas"}
            </h1>
            <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto">
              {user.rol === "admin"
                ? "Gestiona todas las reservas del sistema desde el panel de administración."
                : "Gestiona todas tus reservas de canchas en un solo lugar."}
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {reservas.length === 0
                ? user.rol === "admin"
                  ? "No hay reservas en el sistema"
                  : "No tienes reservas"
                : `${reservas.length} reserva${
                    reservas.length !== 1 ? "s" : ""
                  }${user.rol === "admin" ? " en el sistema" : ""}`}
            </h2>
            <Button
              onClick={() => router.push("/canchas")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>

          {reservas.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aún no tienes reservas
              </h3>
              <p className="text-gray-700 font-medium mb-6">
                Explora nuestras canchas disponibles y haz tu primera reserva.
              </p>
              <Button
                onClick={() => router.push("/canchas")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ver Canchas Disponibles
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {reservas.map((reserva) => (
                <Card
                  key={reserva._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {getCanchaName(reserva)}
                        </CardTitle>
                        <CardDescription className="flex items-center text-gray-700 font-medium mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {getCanchaLocation(reserva)}
                        </CardDescription>
                        {/* Mostrar información del usuario solo para admins */}
                        {user?.rol === "admin" && reserva.usuario_id && (
                          <div className="flex items-center text-blue-600 font-medium mt-2">
                            <User className="h-4 w-4 mr-1" />
                            {reserva.usuario_id.nombre_completo} (
                            {reserva.usuario_id.email})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={getStatusColor(
                            reserva.estado,
                            reserva.pagado
                          )}
                        >
                          {getStatusText(reserva.estado, reserva.pagado)}
                        </Badge>
                        {reserva.pagado && (
                          <Badge className="bg-green-100 text-green-800">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Pagado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Fecha</p>
                          <p className="text-sm text-gray-700 font-medium capitalize">
                            {formatDate(getReservaDateString(reserva))}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Horario</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {reserva.hora_inicio} - {reserva.hora_fin}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            Duración
                          </p>
                          <p className="text-sm text-gray-700 font-medium">
                            {reserva.duracion_horas} hora
                            {reserva.duracion_horas !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {reserva.notas && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-gray-900 mb-1">
                          Notas:
                        </p>
                        <p className="text-sm text-gray-700">{reserva.notas}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatPrice(reserva.precio_total)}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">
                        Reservado el {getCreatedAtLabel(reserva)}
                      </div>
                    </div>

                    {/* Status Messages */}
                    {reserva.estado === "confirmada" && reserva.pagado && (
                      <div className="flex items-center space-x-2 bg-emerald-50 rounded-lg p-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm text-emerald-700">
                          Tu reserva está confirmada y pagada. ¡Te esperamos en
                          la cancha!
                        </p>
                      </div>
                    )}

                    {reserva.estado === "completada" && (
                      <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-3">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-blue-700">
                          ¡Esperamos que hayas disfrutado tu partido!
                        </p>
                      </div>
                    )}

                    {reserva.estado === "confirmada" && !reserva.pagado && (
                      <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-3">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-blue-700">
                          Tu reserva está confirmada. Recuerda completar el pago
                          antes de tu sesión.
                        </p>
                      </div>
                    )}

                    {reserva.estado === "pendiente" && (
                      <div className="flex items-center space-x-2 bg-yellow-50 rounded-lg p-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <p className="text-sm text-yellow-700">
                          Tu reserva está pendiente de confirmación.
                        </p>
                      </div>
                    )}

                    {reserva.estado === "cancelada" && (
                      <div className="flex items-center space-x-2 bg-red-50 rounded-lg p-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-700">
                          Esta reserva ha sido cancelada.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {reserva.estado !== "cancelada" && (
                      <div className="flex space-x-2 pt-4">
                        {canEditReservation(reserva) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => openEditDialog(reserva)}
                                disabled={actionLoading === reserva._id}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modificar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Modificar Reserva</DialogTitle>
                                <DialogDescription>
                                  Actualiza los detalles de tu reserva. Los
                                  cambios están sujetos a disponibilidad.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="fecha" className="text-right">
                                    Fecha
                                  </Label>
                                  <Input
                                    id="fecha"
                                    type="date"
                                    value={editForm.fecha_reserva}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        fecha_reserva: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="inicio"
                                    className="text-right"
                                  >
                                    Inicio
                                  </Label>
                                  <Input
                                    id="inicio"
                                    type="time"
                                    value={editForm.hora_inicio}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        hora_inicio: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="fin" className="text-right">
                                    Fin
                                  </Label>
                                  <Input
                                    id="fin"
                                    type="time"
                                    value={editForm.hora_fin}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        hora_fin: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="notas" className="text-right">
                                    Notas
                                  </Label>
                                  <Textarea
                                    id="notas"
                                    value={editForm.notas}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        notas: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                    placeholder="Notas adicionales (opcional)"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  onClick={handleEditReservation}
                                  disabled={
                                    actionLoading === editingReserva?._id
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {actionLoading === editingReserva?._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Guardar Cambios
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {canCancelReservation(reserva) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                disabled={actionLoading === reserva._id}
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Cancelar Reserva?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se enviará
                                  un email de confirmación de cancelación.
                                  {reserva.pagado && (
                                    <span className="block mt-2 font-medium text-amber-600">
                                      ⚠️ Esta reserva está pagada. El reembolso
                                      se procesará según nuestras políticas.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  No, mantener
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleCancelReservation(reserva._id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {actionLoading === reserva._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Sí, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}

                    {reserva.estado === "completada" && user?.rol !== "admin" && (
                      <div className="flex space-x-2 pt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => setReviewReserva(reserva)}
                              disabled={actionLoading === reserva._id}
                              className="flex-1 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                            >
                              <Star className="h-4 w-4 mr-2 text-yellow-500" />
                              Dejar Reseña
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Dejar Reseña</DialogTitle>
                              <DialogDescription>
                                ¿Qué te pareció tu experiencia en{" "}
                                {reserva.cancha_id?.nombre || "esta cancha"}?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="flex justify-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, calificacion: star })}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star 
                                      className={`h-8 w-8 ${
                                        star <= reviewForm.calificacion
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <div className="grid items-center gap-4">
                                <Label htmlFor="comentario">
                                  Comentario (Opcional)
                                </Label>
                                <Textarea
                                  id="comentario"
                                  value={reviewForm.comentario}
                                  onChange={(e) =>
                                    setReviewForm({
                                      ...reviewForm,
                                      comentario: e.target.value,
                                    })
                                  }
                                  placeholder="Escribe tu opinión sobre la cancha..."
                                  className="min-h-[100px]"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                onClick={handleSubmitReview}
                                disabled={actionLoading === reviewReserva?._id}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                {actionLoading === reviewReserva?._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Enviar Reseña
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
