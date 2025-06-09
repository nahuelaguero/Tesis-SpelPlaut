"use client";

import { useState } from "react";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coordinates: Coordinates;
  address?: string;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface SearchFilters {
  ubicacion?: string;
  radio?: number; // en kilómetros
  precio_min?: number;
  precio_max?: number;
  tipo_cancha?: string;
  capacidad_min?: number;
  capacidad_max?: number;
  disponible_desde?: string;
  disponible_hasta?: string;
  fecha?: string;
  ordenar_por?: "distancia" | "precio" | "calificacion" | "nombre";
  direccion?: "asc" | "desc";
}

export interface CanchaConDistancia {
  _id: string;
  descripcion: string;
  tipo_cancha: string;
  ubicacion: string;
  precio_por_hora: number;
  capacidad_jugadores: number;
  horario_apertura: string;
  horario_cierre: string;
  disponible: boolean;
  distancia?: number; // en kilómetros
  coordenadas?: Coordinates;
  calificacion_promedio?: number;
  total_reviews?: number;
}

export type GeolocationPermissionState =
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported"
  | "unknown";

// Verificar si la geolocalización está soportada
export function isGeolocationSupported(): boolean {
  return "geolocation" in navigator;
}

// Verificar permisos de geolocalización
export async function checkGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (!isGeolocationSupported()) {
    return "unsupported";
  }

  try {
    // Verificar el estado del permiso si está disponible
    if ("permissions" in navigator) {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      return permission.state as GeolocationPermissionState;
    }

    // Si no se puede verificar el permiso, retornar unknown
    return "unknown";
  } catch (error) {
    console.warn("Error verificando permisos de geolocalización:", error);
    return "unknown";
  }
}

// Solicitar permisos de geolocalización al usuario
export async function requestGeolocationPermission(): Promise<GeolocationPermissionState> {
  const permissionState = await checkGeolocationPermission();

  if (permissionState === "unsupported") {
    throw new Error("La geolocalización no está soportada en este dispositivo");
  }

  if (permissionState === "denied") {
    throw new Error(
      "Los permisos de ubicación han sido denegados. Por favor, habilítelos en la configuración del navegador."
    );
  }

  return permissionState;
}

// Obtener ubicación del usuario con solicitud de permisos
export function getCurrentLocation(): Promise<LocationData> {
  return new Promise(async (resolve, reject) => {
    try {
      // Verificar soporte y permisos primero
      const permissionState = await requestGeolocationPermission();

      if (permissionState === "denied") {
        reject(new Error("Permisos de ubicación denegados"));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 segundos
        maximumAge: 300000, // 5 minutos
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          try {
            const address = await reverseGeocode(coordinates);
            resolve({
              coordinates,
              accuracy: position.coords.accuracy,
              ...address,
            });
          } catch {
            // Si falla el reverse geocoding, devolver solo coordenadas
            resolve({
              coordinates,
              accuracy: position.coords.accuracy,
            });
          }
        },
        (error) => {
          let message = "Error desconocido al obtener ubicación";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message =
                "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación para mejorar la experiencia.";
              break;
            case error.POSITION_UNAVAILABLE:
              message =
                "Tu ubicación no está disponible en este momento. Verifica que el GPS esté activado.";
              break;
            case error.TIMEOUT:
              message =
                "Tiempo de espera agotado para obtener tu ubicación. Intenta nuevamente.";
              break;
          }

          reject(new Error(message));
        },
        options
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Reverse geocoding usando una API pública
export async function reverseGeocode(coordinates: Coordinates): Promise<{
  address?: string;
  city?: string;
  country?: string;
}> {
  try {
    // Usar Nominatim de OpenStreetMap (gratuito)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SpelPlaut-App/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error en el servicio de geocodificación");
    }

    const data = await response.json();

    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    };
  } catch (error) {
    console.warn("Error en reverse geocoding:", error);
    return {};
  }
}

// Geocoding - convertir dirección a coordenadas
export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "SpelPlaut-App/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error en el servicio de geocodificación");
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.warn("Error en geocoding:", error);
    return null;
  }
}

// Calcular distancia entre dos puntos usando la fórmula de Haversine
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Filtrar canchas por proximidad
export function filterCanchasByProximity(
  canchas: CanchaConDistancia[],
  userLocation: Coordinates,
  maxDistance: number = 10 // kilómetros
): CanchaConDistancia[] {
  return canchas
    .map((cancha) => {
      if (cancha.coordenadas) {
        const distancia = calculateDistance(userLocation, cancha.coordenadas);
        return { ...cancha, distancia };
      }
      return cancha;
    })
    .filter((cancha) => !cancha.distancia || cancha.distancia <= maxDistance)
    .sort((a, b) => (a.distancia || Infinity) - (b.distancia || Infinity));
}

// Aplicar filtros avanzados
export function applySearchFilters(
  canchas: CanchaConDistancia[],
  filters: SearchFilters,
  userLocation?: Coordinates
): CanchaConDistancia[] {
  let result = [...canchas];

  // Filtro por precio
  if (filters.precio_min !== undefined) {
    result = result.filter(
      (cancha) => cancha.precio_por_hora >= filters.precio_min!
    );
  }
  if (filters.precio_max !== undefined) {
    result = result.filter(
      (cancha) => cancha.precio_por_hora <= filters.precio_max!
    );
  }

  // Filtro por tipo de cancha
  if (filters.tipo_cancha) {
    result = result.filter((cancha) =>
      cancha.tipo_cancha
        .toLowerCase()
        .includes(filters.tipo_cancha!.toLowerCase())
    );
  }

  // Filtro por capacidad
  if (filters.capacidad_min !== undefined) {
    result = result.filter(
      (cancha) => cancha.capacidad_jugadores >= filters.capacidad_min!
    );
  }
  if (filters.capacidad_max !== undefined) {
    result = result.filter(
      (cancha) => cancha.capacidad_jugadores <= filters.capacidad_max!
    );
  }

  // Filtro por ubicación y radio
  if (filters.ubicacion && userLocation) {
    const radio = filters.radio || 10;
    result = filterCanchasByProximity(result, userLocation, radio);
  }

  // Filtrar solo disponibles
  result = result.filter((cancha) => cancha.disponible);

  // Ordenamiento
  if (filters.ordenar_por) {
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.ordenar_por) {
        case "distancia":
          comparison = (a.distancia || Infinity) - (b.distancia || Infinity);
          break;
        case "precio":
          comparison = a.precio_por_hora - b.precio_por_hora;
          break;
        case "calificacion":
          comparison =
            (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0);
          break;
        case "nombre":
          comparison = a.descripcion.localeCompare(b.descripcion);
          break;
      }

      return filters.direccion === "desc" ? -comparison : comparison;
    });
  }

  return result;
}

// Hook para geolocalización con manejo de permisos
export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>("unknown");
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Verificar permisos al cargar el hook
  const checkPermissions = async () => {
    try {
      const state = await checkGeolocationPermission();
      setPermissionState(state);
    } catch (err) {
      console.warn("Error verificando permisos:", err);
      setPermissionState("unknown");
    }
  };

  const getCurrentLocationAsync = async () => {
    setLoading(true);
    setError(null);
    setHasRequestedPermission(true);

    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      setPermissionState("granted");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);

      // Actualizar estado de permisos basado en el error
      if (
        errorMessage.includes("denegado") ||
        errorMessage.includes("denied")
      ) {
        setPermissionState("denied");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  const resetLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    location,
    loading,
    error,
    permissionState,
    hasRequestedPermission,
    isSupported: isGeolocationSupported(),
    getCurrentLocation: getCurrentLocationAsync,
    checkPermissions,
    resetError,
    resetLocation,
  };
}
