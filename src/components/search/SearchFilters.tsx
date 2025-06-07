"use client";

import { useState, useEffect } from "react";
import {
  useGeolocation,
  SearchFilters,
  geocodeAddress,
} from "@/lib/geolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { MapPin, Filter, X, Search } from "lucide-react";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locationSearch, setLocationSearch] = useState(filters.ubicacion || "");
  const {
    location,
    loading: geoLoading,
    getCurrentLocation,
  } = useGeolocation();

  useEffect(() => {
    if (location) {
      onFiltersChange({
        ...filters,
        ubicacion:
          location.address ||
          `${location.coordinates.latitude}, ${location.coordinates.longitude}`,
      });
    }
  }, [location]);

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;

    try {
      const coordinates = await geocodeAddress(locationSearch);
      if (coordinates) {
        onFiltersChange({
          ...filters,
          ubicacion: locationSearch,
        });
      }
    } catch (error) {
      console.error("Error en búsqueda de ubicación:", error);
    }
  };

  const handleGetCurrentLocation = () => {
    getCurrentLocation();
  };

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setLocationSearch("");
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof SearchFilters] !== undefined
  );

  return (
    <Card className="p-6 bg-white shadow-sm border rounded-lg">
      {/* Búsqueda principal */}
      <div className="space-y-4">
        {/* Barra de búsqueda de ubicación */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar por ubicación (ej: Loma Plata, Paraguay)"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
            className="px-3"
          >
            {geoLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={onSearch} disabled={isLoading} className="px-6">
            {isLoading ? (
              <LoadingSpinner
                size="sm"
                className="border-white border-t-white/30"
              />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Buscar
          </Button>
        </div>

        {/* Mostrar ubicación actual */}
        {location && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              Ubicación: {location.city || "Ubicación detectada"}
              {location.accuracy && (
                <span className="text-gray-400">
                  {" "}
                  (±{Math.round(location.accuracy)}m)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Toggle filtros avanzados */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros avanzados
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {
                  Object.keys(filters).filter(
                    (key) => filters[key as keyof SearchFilters] !== undefined
                  ).length
                }
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Radio de búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="radio">Radio (km)</Label>
              <select
                id="radio"
                value={filters.radio || ""}
                onChange={(e) =>
                  handleFilterChange("radio", parseInt(e.target.value) || "")
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin límite</option>
                <option value="1">1 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            {/* Tipo de cancha */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de cancha</Label>
              <select
                id="tipo"
                value={filters.tipo_cancha || ""}
                onChange={(e) =>
                  handleFilterChange("tipo_cancha", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="futbol">Fútbol</option>
                <option value="futsal">Futsal</option>
                <option value="basquet">Básquet</option>
                <option value="tenis">Tenis</option>
                <option value="padel">Pádel</option>
                <option value="voleibol">Vóleibol</option>
              </select>
            </div>

            {/* Ordenar por */}
            <div className="space-y-2">
              <Label htmlFor="ordenar">Ordenar por</Label>
              <select
                id="ordenar"
                value={filters.ordenar_por || ""}
                onChange={(e) =>
                  handleFilterChange("ordenar_por", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Relevancia</option>
                <option value="distancia">Distancia</option>
                <option value="precio">Precio</option>
                <option value="calificacion">Calificación</option>
                <option value="nombre">Nombre</option>
              </select>
            </div>

            {/* Precio mínimo */}
            <div className="space-y-2">
              <Label htmlFor="precio_min">Precio mínimo (Gs.)</Label>
              <Input
                id="precio_min"
                type="number"
                placeholder="0"
                value={filters.precio_min || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "precio_min",
                    parseInt(e.target.value) || ""
                  )
                }
                min="0"
                step="1000"
              />
            </div>

            {/* Precio máximo */}
            <div className="space-y-2">
              <Label htmlFor="precio_max">Precio máximo (Gs.)</Label>
              <Input
                id="precio_max"
                type="number"
                placeholder="Sin límite"
                value={filters.precio_max || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "precio_max",
                    parseInt(e.target.value) || ""
                  )
                }
                min="0"
                step="1000"
              />
            </div>

            {/* Capacidad mínima */}
            <div className="space-y-2">
              <Label htmlFor="capacidad_min">Capacidad mínima</Label>
              <Input
                id="capacidad_min"
                type="number"
                placeholder="0"
                value={filters.capacidad_min || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "capacidad_min",
                    parseInt(e.target.value) || ""
                  )
                }
                min="1"
                max="50"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha deseada</Label>
              <Input
                id="fecha"
                type="date"
                value={filters.fecha || ""}
                onChange={(e) => handleFilterChange("fecha", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Horario desde */}
            <div className="space-y-2">
              <Label htmlFor="disponible_desde">Disponible desde</Label>
              <Input
                id="disponible_desde"
                type="time"
                value={filters.disponible_desde || ""}
                onChange={(e) =>
                  handleFilterChange("disponible_desde", e.target.value)
                }
              />
            </div>

            {/* Horario hasta */}
            <div className="space-y-2">
              <Label htmlFor="disponible_hasta">Disponible hasta</Label>
              <Input
                id="disponible_hasta"
                type="time"
                value={filters.disponible_hasta || ""}
                onChange={(e) =>
                  handleFilterChange("disponible_hasta", e.target.value)
                }
              />
            </div>
          </div>

          {/* Botón de búsqueda en filtros avanzados */}
          <div className="mt-6 flex justify-end">
            <Button onClick={onSearch} disabled={isLoading} className="px-8">
              {isLoading ? (
                <LoadingSpinner
                  size="sm"
                  className="border-white border-t-white/30"
                />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
