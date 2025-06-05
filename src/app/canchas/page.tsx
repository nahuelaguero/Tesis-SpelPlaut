"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  MapPin,
  Star,
  Filter,
  Calendar,
  Clock,
  Users,
  Zap,
  Waves,
  Target,
} from "lucide-react";

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

const tipoIcons: Record<string, React.ElementType> = {
  "Fútbol 11": Users,
  "Fútbol 5": Users,
  Tenis: Target,
  Básquet: Zap,
  Pádel: Target,
  Vóley: Waves,
};

export default function CanchasPage() {
  const { loading } = useAuth();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [selectedTipo, setSelectedTipo] =
    useState<string>("Todos los Deportes");

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

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  const tiposUnicos = useMemo(() => {
    const tipos = [...new Set(canchas.map((cancha) => cancha.tipo))];
    return ["Todos los Deportes", ...tipos];
  }, [canchas]);

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
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCanchas.map((cancha) => {
                const IconComponent = tipoIcons[cancha.tipo] || Users;

                return (
                  <Card
                    key={cancha._id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-5 w-5 text-emerald-600" />
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 font-medium"
                          >
                            {cancha.tipo}
                          </Badge>
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
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {cancha.nombre}
                      </CardTitle>
                      <CardDescription className="flex items-center text-gray-700">
                        <MapPin className="h-4 w-4 mr-1" />
                        {cancha.ubicacion}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-800 font-medium">
                        {cancha.descripcion}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-700">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-700" />
                          <span className="font-medium">
                            Hasta {cancha.capacidad_maxima} jugadores
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-700" />
                          <span className="font-medium">
                            {cancha.horario_apertura} - {cancha.horario_cierre}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatPrice(cancha.precio_por_hora)}
                          <span className="text-sm font-medium text-gray-700">
                            /hora
                          </span>
                        </div>
                        <Badge
                          variant={
                            cancha.disponible ? "default" : "destructive"
                          }
                          className={
                            cancha.disponible
                              ? "bg-emerald-100 text-emerald-800 font-semibold"
                              : "bg-red-100 text-red-800 font-semibold"
                          }
                        >
                          {cancha.disponible ? "Disponible" : "No disponible"}
                        </Badge>
                      </div>

                      {cancha.disponible && (
                        <div className="flex space-x-2">
                          <Link
                            href={`/canchas/${cancha._id}`}
                            className="flex-1"
                          >
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                              <Calendar className="h-4 w-4 mr-2" />
                              Reservar
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
