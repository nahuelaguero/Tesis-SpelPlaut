"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Usuario {
  _id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: "usuario" | "propietario_cancha" | "admin";
  fecha_registro: string;
  cancha_id?: string; // Para propietarios de cancha
}

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (userData: Usuario) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    console.log("🔍 [AuthContext] Verificando autenticación...");
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      console.log("📡 [AuthContext] Respuesta recibida:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [AuthContext] Datos recibidos:", data);
        if (data.success && data.data.user) {
          setUser(data.data.user);
          console.log(
            "👤 [AuthContext] Usuario autenticado:",
            data.data.user.email
          );
        } else {
          setUser(null);
          console.log("❌ [AuthContext] No hay usuario en la respuesta");
        }
      } else {
        setUser(null);
        console.log("❌ [AuthContext] Respuesta no exitosa:", response.status);
      }
    } catch (error) {
      console.error("❌ [AuthContext] Error verificando autenticación:", error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("🏁 [AuthContext] Verificación completada");
    }
  };

  const login = (userData: Usuario) => {
    setUser(userData);
    setLoading(false); // Asegurar que loading se ponga en false después del login
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    await checkAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
