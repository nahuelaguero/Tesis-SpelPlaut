"use client";

import { useState } from "react";
import { MapPin, Search, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationPickerProps {
  onLocationSelect?: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  defaultLocation?: string;
}

export function LocationPicker({
  onLocationSelect,
  defaultLocation = "",
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(defaultLocation);
  const [isSearching, setIsSearching] = useState(false);

  // Coordenadas predeterminadas para Loma Plata, Paraguay
  const defaultCoordinates = {
    lat: -22.3667,
    lng: -59.85,
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Simular búsqueda de geocodificación
    setTimeout(() => {
      // Por ahora usar coordenadas fijas cerca de Loma Plata
      const simulatedLocation = {
        address: searchQuery,
        coordinates: {
          lat: defaultCoordinates.lat + (Math.random() - 0.5) * 0.01,
          lng: defaultCoordinates.lng + (Math.random() - 0.5) * 0.01,
        },
      };

      if (onLocationSelect) {
        onLocationSelect(simulatedLocation);
      }

      setIsSearching(false);
    }, 1000);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            address: `${position.coords.latitude}, ${position.coords.longitude}`,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          };

          if (onLocationSelect) {
            onLocationSelect(location);
          }
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          // Usar ubicación por defecto si no se puede obtener GPS
          const location = {
            address: "Loma Plata, Paraguay (ubicación aproximada)",
            coordinates: defaultCoordinates,
          };

          if (onLocationSelect) {
            onLocationSelect(location);
          }
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ubicacion-search">Buscar ubicación</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="ubicacion-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: Av. Central 123, Loma Plata"
            onKeyPress={(e) => e.key === "Enter" && handleAddressSearch()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddressSearch}
            disabled={isSearching}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCurrentLocation}
            title="Usar mi ubicación actual"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mapa simulado */}
      <div className="h-64 bg-gray-100 border border-gray-300 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
          {/* Contenido del mapa simulado */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">
                Mapa interactivo
              </p>
              <p className="text-xs text-gray-500">
                Sistema de mapas en desarrollo
              </p>
            </div>
          </div>

          {/* Marcador simulado */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              marginTop: "-12px",
              marginLeft: "0px",
            }}
          >
            <MapPin className="h-6 w-6 text-red-600 drop-shadow-lg" />
          </div>

          {/* Controles del mapa */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
            <div className="text-xs text-gray-600">Zoom: +/-</div>
          </div>

          {/* Información de coordenadas */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2">
            <div className="text-xs text-gray-600">
              Lat: {defaultCoordinates.lat}
              <br />
              Lng: {defaultCoordinates.lng}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
        💡 <strong>Funcionalidad futura:</strong> Integración con
        OpenStreetMap/Leaflet para selección interactiva de ubicaciones en
        Paraguay
      </div>
    </div>
  );
}
