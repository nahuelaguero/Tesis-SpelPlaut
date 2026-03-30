"use client";

import { useState } from "react";

// Re-export server-safe types and functions from geolocation-utils
export type {
  Coordinates,
  LocationData,
  SearchFilters,
  CanchaConDistancia,
} from "./geolocation-utils";

export {
  reverseGeocode,
  geocodeAddress,
  calculateDistance,
  filterCanchasByProximity,
  applySearchFilters,
} from "./geolocation-utils";

import type { Coordinates, LocationData } from "./geolocation-utils";
import { reverseGeocode } from "./geolocation-utils";

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

// Client-only functions below (browser APIs: navigator, etc.)

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
