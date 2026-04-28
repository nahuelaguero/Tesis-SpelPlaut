"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.rol === "admin") {
      router.replace("/admin");
      return;
    }

    if (user.rol === "propietario_cancha") {
      router.replace("/mi-cancha");
      return;
    }

    router.replace("/mis-reservas");
  }, [loading, router, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
          <p className="mt-4 text-sm font-medium text-gray-700">
            Redirigiendo a tu panel...
          </p>
        </div>
      </div>
    </div>
  );
}
