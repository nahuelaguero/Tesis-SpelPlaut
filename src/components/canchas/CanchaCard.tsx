"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  Clock,
  DollarSign,
  Star,
  ImageIcon,
  ExternalLink,
  Navigation,
} from "lucide-react";

interface CanchaCardProps {
  cancha: {
    _id: string;
    descripcion: string;
    tipo_cancha: string;
    ubicacion: string;
    precio_por_hora: number;
    capacidad_jugadores: number;
    horario_apertura: string;
    horario_cierre: string;
    disponible: boolean;
    distancia?: number;
    calificacion_promedio?: number;
    total_reviews?: number;
    imagenes?: string[];
    coordenadas?: {
      latitude: number;
      longitude: number;
    };
  };
  showDistance?: boolean;
  priority?: boolean;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

// Skeleton component para loading
const CanchaCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-0">
      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CanchaCard = memo(
  ({
    cancha,
    showDistance = false,
    priority = false,
    userLocation,
  }: CanchaCardProps) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: "PYG",
        minimumFractionDigits: 0,
      }).format(price);
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

    // Calcular distancia si tenemos coordenadas
    const distance =
      userLocation && cancha.coordenadas
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            cancha.coordenadas.latitude,
            cancha.coordenadas.longitude
          )
        : cancha.distancia;

    // Generar link de Google Maps
    const getGoogleMapsLink = () => {
      if (cancha.coordenadas) {
        return `https://www.google.com/maps?q=${cancha.coordenadas.latitude},${cancha.coordenadas.longitude}`;
      } else {
        // Usar búsqueda por dirección si no hay coordenadas
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          cancha.ubicacion
        )}`;
      }
    };

    // Generar link de direcciones desde ubicación actual
    const getDirectionsLink = () => {
      if (userLocation && cancha.coordenadas) {
        return `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${cancha.coordenadas.latitude},${cancha.coordenadas.longitude}`;
      } else if (cancha.coordenadas) {
        return `https://www.google.com/maps/dir/?api=1&destination=${cancha.coordenadas.latitude},${cancha.coordenadas.longitude}`;
      } else {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          cancha.ubicacion
        )}`;
      }
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

    const getTypeColor = (tipo: string) => {
      const colores: Record<string, string> = {
        Football11: "bg-green-100 text-green-800",
        Football5: "bg-emerald-100 text-emerald-800",
        futbol: "bg-green-100 text-green-800",
        futsal: "bg-emerald-100 text-emerald-800",
        Tennis: "bg-blue-100 text-blue-800",
        tenis: "bg-blue-100 text-blue-800",
        Basketball: "bg-orange-100 text-orange-800",
        basquet: "bg-orange-100 text-orange-800",
        Padel: "bg-purple-100 text-purple-800",
        padel: "bg-purple-100 text-purple-800",
        Volleyball: "bg-pink-100 text-pink-800",
        voleibol: "bg-pink-100 text-pink-800",
      };
      return colores[tipo] || "bg-gray-100 text-gray-800";
    };

    const renderStars = (rating: number) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;

      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        );
      }

      if (hasHalfStar) {
        stars.push(
          <Star
            key="half"
            className="h-3 w-3 fill-yellow-400/50 text-yellow-400"
          />
        );
      }

      const remainingStars = 5 - Math.ceil(rating);
      for (let i = 0; i < remainingStars; i++) {
        stars.push(
          <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
        );
      }

      return stars;
    };

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
        <CardContent className="p-0">
          {/* Imagen de la cancha */}
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <ImageIcon className="h-12 w-12 text-gray-400 animate-pulse" />
              </div>
            )}

            {!imageError && cancha.imagenes && cancha.imagenes.length > 0 ? (
              <Image
                src={cancha.imagenes[0]}
                alt={cancha.descripcion}
                fill
                className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Badge de disponibilidad */}
            <div className="absolute top-2 left-2">
              <Badge
                variant={cancha.disponible ? "default" : "secondary"}
                className={
                  cancha.disponible
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-500"
                }
              >
                {cancha.disponible ? "Disponible" : "No disponible"}
              </Badge>
            </div>

            {/* Badge de distancia */}
            {showDistance && distance !== undefined && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm"
                >
                  {distance.toFixed(1)} km
                </Badge>
              </div>
            )}
          </div>

          {/* Contenido de la card */}
          <div className="p-4 space-y-3">
            {/* Header con tipo y calificación */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className={`${getTypeColor(
                      cancha.tipo_cancha
                    )} font-medium`}
                  >
                    {getTypeLabel(cancha.tipo_cancha)}
                  </Badge>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {cancha.descripcion}
                </h3>
              </div>

              {/* Calificación */}
              {cancha.calificacion_promedio && cancha.total_reviews && (
                <div className="text-right ml-2">
                  <div className="flex items-center gap-1">
                    {renderStars(cancha.calificacion_promedio)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    ({cancha.total_reviews})
                  </p>
                </div>
              )}
            </div>

            {/* Ubicación con distancia */}
            <div className="space-y-1">
              <div className="flex items-center text-gray-700">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {cancha.ubicacion}
                </span>
              </div>
              {distance !== undefined && (
                <div className="flex items-center text-emerald-600 text-sm">
                  <Navigation className="h-3 w-3 mr-1" />
                  <span className="font-medium">
                    {distance.toFixed(1)} km de distancia
                  </span>
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-gray-700">
                <Users className="h-4 w-4 mr-1" />
                <span className="font-medium">
                  {cancha.capacidad_jugadores} jugadores
                </span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-medium">
                  {cancha.horario_apertura} - {cancha.horario_cierre}
                </span>
              </div>
            </div>

            {/* Botones de mapa */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <a
                href={getGoogleMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Ver en mapa
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
              {userLocation && (
                <a
                  href={getDirectionsLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Cómo llegar
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              )}
            </div>

            {/* Precio y botón principal */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="flex items-center text-emerald-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="font-bold text-lg">
                  {formatPrice(cancha.precio_por_hora)}
                </span>
                <span className="text-sm text-gray-600 ml-1">/hora</span>
              </div>
              <Link href={`/canchas/${cancha._id}`}>
                <Button
                  size="sm"
                  className="hover:scale-105 transition-transform duration-200"
                  disabled={!cancha.disponible}
                >
                  {cancha.disponible ? "Ver detalles" : "No disponible"}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

CanchaCard.displayName = "CanchaCard";

export { CanchaCard, CanchaCardSkeleton };
