"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CanchaCard,
  CanchaCardSkeleton,
} from "@/components/canchas/CanchaCard";
import { useGeolocation } from "@/lib/geolocation";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Filter, MapPin } from "lucide-react";

interface Cancha {
  _id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  precio_por_hora: number;
  capacidad_maxima: number;
  disponible: boolean;
  descripcion: string;
  servicios: string[];
  horario_apertura: string;
  horario_cierre: string;
  imagen_url?: string;
  valoracion?: number;
}

export default function CanchasPage() {
  const { user, loading } = useAuth();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [selectedTipo, setSelectedTipo] =
    useState<string>("Todos los Deportes");
  const { location, getCurrentLocation } = useGeolocation();

  // Obtener todas las canchas
  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const response = await fetch("/api/canchas", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCanchas(data.data.canchas);
          }
        } else {
          console.error("Error al obtener canchas:", response.statusText);
        }
      } catch (error) {
        console.error("Error al cargar canchas:", error);
      } finally {
        setLoadingCanchas(false);
      }
    };

    fetchCanchas();
  }, []);

  // Memoizar canchas filtradas para optimizar performance
  const filteredCanchas = useMemo(() => {
    let filtered = canchas;

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cancha) =>
          cancha.nombre.toLowerCase().includes(searchLower) ||
          cancha.ubicacion.toLowerCase().includes(searchLower) ||
          cancha.tipo.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo
    if (selectedTipo !== "Todos los Deportes") {
      filtered = filtered.filter((cancha) => cancha.tipo === selectedTipo);
    }

    return filtered;
  }, [canchas, searchTerm, selectedTipo]);

  const tiposUnicos = useMemo(() => {
    const tipos = [...new Set(canchas.map((cancha) => cancha.tipo))];
    return ["Todos los Deportes", ...tipos];
  }, [canchas]);

  // Solo bloquear a propietarios de cancha (admins pueden ver todo)
  if (!loading && user && user.rol === "propietario_cancha") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-6">
            Los propietarios de cancha no pueden hacer reservas. Solo pueden
            gestionar su propia cancha.
          </p>
          <Button
            onClick={() => (window.location.href = "/mi-cancha")}
            className="w-full"
          >
            Ir a Mi Cancha
          </Button>
        </div>
      </div>
    );
  }

  if (loading || loadingCanchas) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">
              Cargando canchas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold">
              Canchas en Loma Plata
            </h1>
            <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto">
              Encuentra tu cancha favorita y reserva al instante con SpelPlaut.
            </p>
          </div>
        </div>
      </section>

      {/* Filtros y Búsqueda */}
      <section className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                type="text"
                placeholder="Buscar canchas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 placeholder:text-gray-500"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-700" />
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {tiposUnicos.map((tipo: string) => (
                  <option key={tipo} value={tipo} className="text-gray-900">
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón de ubicación */}
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              className="flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <MapPin className="h-4 w-4" />
              {location ? "Ubicación detectada" : "Mi ubicación"}
            </Button>
          </div>

          {/* Mostrar ubicación detectada */}
          {location && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-800">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Ubicación: {location.city || location.address || "Detectada"}
                  {location.accuracy && (
                    <span className="text-emerald-600 ml-2">
                      (±{Math.round(location.accuracy)}m de precisión)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Resultados */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredCanchas.length === 0
                ? "0 canchas disponibles"
                : `${filteredCanchas.length} cancha${
                    filteredCanchas.length !== 1 ? "s" : ""
                  } disponible${filteredCanchas.length !== 1 ? "s" : ""}`}
            </h2>
          </div>

          {filteredCanchas.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron canchas que coincidan con tu búsqueda
              </h3>
              <p className="text-gray-700 font-medium mb-6">
                Intenta con otros términos de búsqueda o cambia los filtros.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTipo("Todos los Deportes");
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <CanchaCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCanchas.map((cancha, index) => {
                  // Convertir el formato de cancha al que espera CanchaCard
                  // Simular coordenadas para Loma Plata (centro aproximado)
                  const baseLatitude = -22.3667;
                  const baseLongitude = -59.85;
                  const randomOffset = () => (Math.random() - 0.5) * 0.02; // ~1km de radio

                  const canchaFormatted = {
                    _id: cancha._id,
                    descripcion: cancha.nombre, // CanchaCard usa descripcion para el título
                    tipo_cancha: cancha.tipo,
                    ubicacion: cancha.ubicacion,
                    precio_por_hora: cancha.precio_por_hora,
                    capacidad_jugadores: cancha.capacidad_maxima,
                    horario_apertura: cancha.horario_apertura,
                    horario_cierre: cancha.horario_cierre,
                    disponible: cancha.disponible,
                    calificacion_promedio: cancha.valoracion,
                    total_reviews: cancha.valoracion
                      ? Math.floor(Math.random() * 50) + 5
                      : undefined,
                    imagenes: cancha.imagen_url
                      ? [cancha.imagen_url]
                      : ["/api/placeholder/600/400"],
                    // Coordenadas simuladas para Loma Plata
                    coordenadas: {
                      latitude: baseLatitude + randomOffset(),
                      longitude: baseLongitude + randomOffset(),
                    },
                  };

                  return (
                    <CanchaCard
                      key={cancha._id}
                      cancha={canchaFormatted}
                      priority={index < 3} // Prioridad para las primeras 3 imágenes
                      userLocation={location?.coordinates}
                      showDistance={!!location}
                    />
                  );
                })}
              </div>
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}
