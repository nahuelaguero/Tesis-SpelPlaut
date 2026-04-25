"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoading, setShowLoading] = useState(false);
  usePushSubscription(!!user);

  // Rutas auth-only: redirigen a home si el usuario YA está logueado.
  const authOnlyRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isAuthOnlyRoute = authOnlyRoutes.includes(pathname);

  // Rutas accesibles sin sesión (catálogo público + auth pages).
  // El usuario logueado las ve normalmente con su sesión.
  const isOpenRoute =
    isAuthOnlyRoute ||
    pathname === "/" ||
    pathname === "/canchas" ||
    pathname.startsWith("/canchas/");

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoading(true), 150);
      return () => clearTimeout(timer);
    }
    setShowLoading(false);
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    if (!user && !isOpenRoute) {
      router.push("/login");
    } else if (user && isAuthOnlyRoute) {
      if (user.rol === "propietario_cancha") {
        router.push("/mi-cancha");
      } else {
        router.push("/");
      }
    }
  }, [user, loading, isOpenRoute, isAuthOnlyRoute, router, pathname]);

  if (loading && showLoading) {
    return <LoadingScreen />;
  }

  if (!loading && !user && !isOpenRoute) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
