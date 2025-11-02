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
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Clock,
  DollarSign,
  Users,
  Edit,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Header from "@/components/layout/Header";

interface Cancha {
  _id: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  precio_por_hora: number;
  tipo_cancha: string;
  capacidad_jugadores: number;
  horario_apertura: string;
  horario_cierre: string;
  imagenes: string[];
  disponible: boolean;
  propietario_id?: {
    _id: string;
    nombre_completo: string;
    email: string;
  };
}

export default function AdminCanchasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  // Verificar permisos
  useEffect(() => {
    if (!loading && (!user || user.rol !== "admin")) {
      router.push("/");
      return;
    }

    if (user && user.rol === "admin") {
      loadCanchas();
    }
  }, [user, loading, router]);

  const loadCanchas = async () => {
    try {
      const response = await fetch("/api/canchas", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCanchas(data.data.canchas || []);
        } else {
          setMessage(data.message || "Error al cargar canchas");
        }
      } else {
        setMessage("Error al obtener canchas");
      }
    } catch (error) {
      console.error("Error al cargar canchas:", error);
      setMessage("Error de conexión al cargar canchas");
    } finally {
      setLoadingCanchas(false);
    }
  };

  const toggleDisponibilidad = async (
    canchaId: string,
    disponible: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/canchas/${canchaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ disponible: !disponible }),
      });

      if (response.ok) {
        setMessage(
          `Cancha ${!disponible ? "activada" : "desactivada"} exitosamente`
        );
        await loadCanchas(); // Recargar datos
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error al actualizar disponibilidad de cancha");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error de conexión");
    }
  };

  const filteredCanchas = canchas.filter((cancha) => {
    return (
      cancha.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cancha.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cancha.tipo_cancha.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDisponibilidadBadge = (disponible: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          disponible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-1 ${
            disponible ? "bg-green-600" : "bg-red-600"
          }`}
        />
        {disponible ? "Disponible" : "No disponible"}
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

  if (loading || loadingCanchas) {
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
              <MapPin className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Gestión de Canchas
                </h1>
                <p className="text-gray-600">
                  Administra todas las canchas del sistema
                </p>
              </div>
            </div>

            <Button
              onClick={() => router.push("/admin/canchas/nueva")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Agregar Cancha</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700">{message}</p>
            </div>
          )}

          {/* Buscador */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar canchas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">
                {canchas.length}
              </div>
              <p className="text-sm text-gray-600">Total canchas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {canchas.filter((c) => c.disponible).length}
              </div>
              <p className="text-sm text-gray-600">Disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {canchas.filter((c) => !c.disponible).length}
              </div>
              <p className="text-sm text-gray-600">No disponibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de canchas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredCanchas.map((cancha) => (
            <Card
              key={cancha._id}
              className="hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                {cancha.imagenes && cancha.imagenes.length > 0 ? (
                  <Image
                    src={cancha.imagenes[0]}
                    alt={cancha.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <MapPin className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  {getDisponibilidadBadge(cancha.disponible)}
                </div>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {cancha.nombre}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {cancha.ubicacion}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2 overflow-hidden">
                    {cancha.descripcion}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{cancha.capacidad_jugadores} jugadores</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {cancha.horario_apertura} - {cancha.horario_cierre}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {cancha.tipo_cancha}
                    </span>
                    <div className="flex items-center text-emerald-600 font-bold">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatPrice(cancha.precio_por_hora)}/hora</span>
                    </div>
                  </div>

                  {cancha.propietario_id && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Propietario:</span>{" "}
                        {cancha.propietario_id.nombre_completo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cancha.propietario_id.email}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/canchas/${cancha._id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/admin/canchas/${cancha._id}`)
                      }
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={cancha.disponible ? "destructive" : "default"}
                      onClick={() =>
                        toggleDisponibilidad(cancha._id, cancha.disponible)
                      }
                      className={
                        cancha.disponible
                          ? ""
                          : "bg-green-600 hover:bg-green-700"
                      }
                    >
                      {cancha.disponible ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCanchas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm
                  ? "No se encontraron canchas con ese término de búsqueda"
                  : "No hay canchas registradas"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
