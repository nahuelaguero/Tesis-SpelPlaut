"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface Usuario {
  _id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: "usuario" | "propietario_cancha" | "admin";
  fecha_registro: string;
  autenticacion_2FA: boolean; // Campo 2FA
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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  }, []);

  const login = (userData: Usuario) => {
    setUser(userData);
    setLoading(false);
    setInitialCheckDone(true);
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
    // Verificación inmediata sin delay
    if (!initialCheckDone) {
      checkAuth();
    }
  }, [initialCheckDone, checkAuth]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
