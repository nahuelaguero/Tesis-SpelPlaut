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
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Reserva {
  _id: string;
  cancha_id: {
    _id: string;
    nombre: string;
    ubicacion: string;
  };
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_horas: number;
  precio_total: number;
  estado: "confirmada" | "pendiente" | "cancelada";
  fecha_creacion: string;
}

export default function MisReservasPage() {
  const { user, loading } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    const fetchReservas = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/reservas/mis-reservas", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReservas(data.data.reservas);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
            <h1 className="text-4xl sm:text-5xl font-bold">Mis Reservas</h1>
            <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto">
              Gestiona todas tus reservas de canchas en un solo lugar.
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
                ? "No tienes reservas"
                : `${reservas.length} reserva${
                    reservas.length !== 1 ? "s" : ""
                  }`}
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
                          {reserva.cancha_id.nombre}
                        </CardTitle>
                        <CardDescription className="flex items-center text-gray-700 font-medium mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {reserva.cancha_id.ubicacion}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          reserva.estado === "confirmada"
                            ? "default"
                            : reserva.estado === "pendiente"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {reserva.estado === "confirmada"
                          ? "Confirmada"
                          : reserva.estado === "pendiente"
                          ? "Pendiente"
                          : "Cancelada"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Fecha</p>
                          <p className="text-sm text-gray-700 font-medium capitalize">
                            {formatDate(reserva.fecha_reserva)}
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

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatPrice(reserva.precio_total)}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">
                        Reservado el{" "}
                        {new Date(reserva.fecha_reserva).toLocaleDateString(
                          "es-ES"
                        )}
                      </div>
                    </div>

                    {reserva.estado === "confirmada" && (
                      <div className="flex items-center space-x-2 bg-emerald-50 rounded-lg p-3">
                        <AlertCircle className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm text-emerald-700">
                          Tu reserva está confirmada. ¡Te esperamos en la
                          cancha!
                        </p>
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
