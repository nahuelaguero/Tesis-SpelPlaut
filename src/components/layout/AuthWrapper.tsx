"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoading, setShowLoading] = useState(false);

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Solo mostrar loading después de un pequeño delay para evitar parpadeo
    if (loading) {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    // Solo redirigir cuando ya no estamos cargando
    if (!loading) {
      if (!user && !isPublicRoute) {
        // Usuario no autenticado intentando acceder a ruta privada
        router.push("/login");
      } else if (user && isPublicRoute) {
        // Usuario autenticado en ruta pública, redirigir según rol
        if (user.rol === "propietario_cancha") {
          router.push("/mi-cancha");
        } else {
          router.push("/");
        }
      }
      // Si user && !isPublicRoute -> el usuario está autenticado en una ruta privada,
      // mantener la URL actual (perfil, admin, etc.)
    }
  }, [user, loading, isPublicRoute, router, pathname]);

  // Mostrar loading si:
  // 1. AuthContext está cargando
  // 2. Estamos en el período de delay
  // 3. Usuario no autenticado en ruta privada (durante redirección)
  if (loading && showLoading) {
    return <LoadingScreen />;
  }

  // Si no hay usuario y es ruta privada, mostrar loading durante redirección
  if (!loading && !user && !isPublicRoute) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
