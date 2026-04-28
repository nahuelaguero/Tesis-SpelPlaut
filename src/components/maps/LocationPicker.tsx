"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationSelect?: (location: {
    address: string;
    coordinates: Coordinates;
  }) => void;
  defaultLocation?: string;
  defaultCoordinates?: Coordinates | null;
}

interface SelectedLocation {
  address: string;
  coordinates: Coordinates;
}

const DEFAULT_COORDINATES: Coordinates = {
  latitude: -22.3667,
  longitude: -59.85,
};

const DEFAULT_ADDRESS = "Loma Plata, Boquerón, Paraguay";

export function LocationPicker({
  onLocationSelect,
  defaultLocation = "",
  defaultCoordinates = null,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(defaultLocation);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(
      defaultCoordinates
        ? {
            address: defaultLocation || DEFAULT_ADDRESS,
            coordinates: defaultCoordinates,
          }
        : null
    );
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchQuery(defaultLocation);

    if (defaultCoordinates) {
      setSelectedLocation({
        address: defaultLocation || DEFAULT_ADDRESS,
        coordinates: defaultCoordinates,
      });
      return;
    }

    if (!defaultLocation) {
      setSelectedLocation(null);
    }
  }, [defaultCoordinates, defaultLocation]);

  const mapCenter = useMemo(
    () => selectedLocation?.coordinates || DEFAULT_COORDINATES,
    [selectedLocation]
  );

  const applyLocation = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setSearchQuery(location.address);
    setError("");
    onLocationSelect?.(location);
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Ingresa una dirección o referencia para ubicar la cancha.");
      return;
    }

    try {
      setIsSearching(true);
      setError("");

      const response = await fetch(
        `/api/ubicaciones/geocode?q=${encodeURIComponent(searchQuery.trim())}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "No se pudo geocodificar la ubicación ingresada."
        );
      }

      applyLocation(data.data.location);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "No se pudo ubicar esa dirección."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Este navegador no soporta geolocalización.");
      return;
    }

    setIsSearching(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/ubicaciones/geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.message || "No se pudo obtener la dirección actual."
            );
          }

          applyLocation(data.data.location);
        } catch (locationError) {
          setError(
            locationError instanceof Error
              ? locationError.message
              : "No se pudo obtener tu ubicación actual."
          );
        } finally {
          setIsSearching(false);
        }
      },
      () => {
        setError(
          "No se pudo acceder a tu ubicación. Revisa permisos o usa búsqueda manual."
        );
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <Label htmlFor="ubicacion-search">Ubicación validada en mapa</Label>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row">
          <Input
            id="ubicacion-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Ej: Estadio Municipal, Loma Plata, Paraguay"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAddressSearch();
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleAddressSearch()}
              disabled={isSearching}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCurrentLocation}
              disabled={isSearching}
            >
              <LocateFixed className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {selectedLocation ? "Ubicación seleccionada" : "Mapa de referencia"}
            </p>
            <p className="text-xs text-slate-500">
              {selectedLocation
                ? selectedLocation.address
                : "Busca una dirección o usa GPS para fijar coordenadas reales."}
            </p>
          </div>
          {selectedLocation && (
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              {selectedLocation.coordinates.latitude.toFixed(5)},{" "}
              {selectedLocation.coordinates.longitude.toFixed(5)}
            </div>
          )}
        </div>

        <div className="h-72 w-full">
          <MapContainer
            key={`${mapCenter.latitude}-${mapCenter.longitude}`}
            center={[mapCenter.latitude, mapCenter.longitude]}
            zoom={selectedLocation ? 16 : 12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[mapCenter.latitude, mapCenter.longitude]}>
              <Popup>
                {selectedLocation?.address || DEFAULT_ADDRESS}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Guarda la cancha con coordenadas reales para que el mapa público y
            el cálculo de distancia funcionen sin datos simulados.
          </span>
        </div>
      </div>
    </div>
  );
}
