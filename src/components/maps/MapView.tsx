"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { MapPin, Navigation, ExternalLink } from "lucide-react";

// Importar Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface CanchaMapData {
  _id: string;
  nombre: string;
  descripcion: string;
  tipo_cancha: string;
  ubicacion: string;
  precio_por_hora: number;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  distancia?: number;
}

interface MapViewProps {
  canchas: CanchaMapData[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  onCanchaClick?: (cancha: CanchaMapData) => void;
  showUserLocation?: boolean;
  height?: string;
}

// Definir tipos personalizados para Leaflet
interface LatLng {
  lat: number;
  lng: number;
}

// Componente del marcador personalizado
function CanchaMarker({
  cancha,
  onClick,
}: {
  cancha: CanchaMapData;
  onClick?: () => void;
}) {
  if (!cancha.coordenadas) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTypeLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      Football11: "Fútbol 11",
      Football5: "Fútbol 5",
      Tennis: "Tenis",
      Basketball: "Básquet",
      Padel: "Pádel",
      Volleyball: "Vóley",
      futbol: "Fútbol",
      futsal: "Futsal",
      basquet: "Básquet",
      tenis: "Tenis",
      padel: "Pádel",
      voleibol: "Vóley",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <Marker
      position={[cancha.coordenadas.latitude, cancha.coordenadas.longitude]}
      eventHandlers={{
        click: () => onClick?.(),
      }}
    >
      <Popup>
        <div className="min-w-[250px] p-2">
          <h3 className="font-semibold text-lg mb-2">{cancha.nombre}</h3>

          <div className="space-y-2">
            <Badge variant="outline" className="text-emerald-600">
              {getTypeLabel(cancha.tipo_cancha)}
            </Badge>

            <p className="text-sm text-gray-600 line-clamp-2">
              {cancha.descripcion}
            </p>

            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              {cancha.ubicacion}
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-emerald-600">
                {formatPrice(cancha.precio_por_hora)}/hora
              </span>

              {cancha.distancia && (
                <span className="text-sm text-gray-500">
                  {cancha.distancia.toFixed(1)} km
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${
                      cancha.coordenadas!.latitude
                    },${cancha.coordenadas!.longitude}`,
                    "_blank"
                  )
                }
              >
                <Navigation className="h-3 w-3 mr-1" />
                Direcciones
              </Button>

              <Button
                size="sm"
                onClick={() => window.open(`/canchas/${cancha._id}`, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver detalles
              </Button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function MapView({
  canchas,
  userLocation,
  onCanchaClick,
  showUserLocation = true,
  height = "400px",
}: MapViewProps) {
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState<LatLng>({
    lat: -25.2637,
    lng: -57.5759,
  }); // Asunción por defecto

  useEffect(() => {
    // Configurar centro del mapa
    if (userLocation) {
      setCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    } else if (canchas.length > 0 && canchas[0].coordenadas) {
      setCenter({
        lat: canchas[0].coordenadas.latitude,
        lng: canchas[0].coordenadas.longitude,
      });
    }

    setMapReady(true);
  }, [userLocation, canchas]);

  // Filtrar canchas que tienen coordenadas
  const canchasConCoordenadas = canchas.filter((cancha) => cancha.coordenadas);

  if (!mapReady) {
    return (
      <Card style={{ height }}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-600">Cargando mapa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ height }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Ubicación de canchas
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-80px)]">
        <div style={{ height: "100%", width: "100%" }}>
          <MapContainer
            center={center}
            zoom={userLocation ? 13 : 11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Marcador de ubicación del usuario */}
            {showUserLocation && userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
              >
                <Popup>
                  <div className="text-center p-2">
                    <div className="text-blue-600 mb-2">
                      <MapPin className="h-6 w-6 mx-auto" />
                    </div>
                    <h3 className="font-semibold">Tu ubicación</h3>
                    <p className="text-sm text-gray-600">Estás aquí</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marcadores de canchas */}
            {canchasConCoordenadas.map((cancha) => (
              <CanchaMarker
                key={cancha._id}
                cancha={cancha}
                onClick={() => onCanchaClick?.(cancha)}
              />
            ))}
          </MapContainer>
        </div>

        {/* Información adicional */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Canchas ({canchasConCoordenadas.length})</span>
            </div>

            {showUserLocation && userLocation && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Tu ubicación</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
