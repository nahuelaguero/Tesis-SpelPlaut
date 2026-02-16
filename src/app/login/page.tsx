"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { ApiResponse } from "@/types";

interface LoginFormData {
  email: string;
  password: string;
}

interface TwoFARequestData {
  developmentCode?: string;
}

interface LoginResponseData {
  user: {
    _id: string;
    nombre_completo: string;
    email: string;
    telefono: string;
    rol: "usuario" | "admin" | "propietario_cancha";
    autenticacion_2FA: boolean;
    fecha_registro: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados para 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        if (data.twoFARequired) {
          // Usuario requiere 2FA
          setRequires2FA(true);
          setEmailSent(false); // Resetear para que se envíe el email automáticamente
          setError(""); // Limpiar errores
        } else if (data.data) {
          // Login exitoso sin 2FA
          const responseData = data.data as LoginResponseData;
          if (responseData.user) {
            login(responseData.user);
          }
          router.push("/");
        }
      } else {
        setError(data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest2FACode = useCallback(async () => {
    setIs2FALoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/request-2fa-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setError(""); // Limpiar errores

        // En desarrollo, mostrar el código en la consola y en la UI
        if (data.data) {
          const twoFAData = data.data as TwoFARequestData;
          if (twoFAData.developmentCode) {
            console.log(
              "🔐 CÓDIGO 2FA (DESARROLLO):",
              twoFAData.developmentCode
            );
            setError(
              `✅ Código enviado. DESARROLLO: ${twoFAData.developmentCode}`
            );
          }
        } else {
          // En producción, solo mostrar mensaje de éxito
          setError("✅ Código de verificación enviado a tu email");
        }
      } else {
        setError(data.message || "Error al enviar código 2FA");
        setEmailSent(false); // Permitir reintento
      }
    } catch (error) {
      console.error("Error al solicitar código 2FA:", error);
      setError("Error de conexión al solicitar código 2FA");
      setEmailSent(false); // Permitir reintento
    } finally {
      setIs2FALoading(false);
    }
  }, [formData.email, formData.password]);

  // Efecto para enviar código 2FA automáticamente cuando se requiere
  useEffect(() => {
    if (requires2FA && !emailSent) {
      handleRequest2FACode();
      setEmailSent(true);
    }
  }, [requires2FA, emailSent, handleRequest2FACode]);

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIs2FALoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-2fa-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          codigo_2fa: twoFACode,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        // Login exitoso con 2FA
        const responseData = data.data as LoginResponseData;
        if (responseData.user) {
          login(responseData.user);
        }
        router.push("/");
      } else {
        setError(data.message || "Código 2FA incorrecto");
      }
    } catch (error) {
      console.error("Error en verificación 2FA:", error);
      setError("Error de conexión al verificar código 2FA");
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTwoFACode("");
    setError("");
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center">
            <Calendar className="h-12 w-12 text-sky-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-700 font-medium">
            Accede a tu cuenta para reservar canchas
          </p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold flex items-center gap-2">
              {requires2FA ? (
                <>
                  <Shield className="h-5 w-5 text-sky-600" />
                  Verificación 2FA
                </>
              ) : (
                "Bienvenido de vuelta"
              )}
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              {requires2FA
                ? "Ingresa el código de verificación enviado a tu email"
                : "Ingresa tus credenciales para acceder a tu cuenta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!requires2FA ? (
              // Formulario de login normal
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-sky-600 hover:text-sky-500"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Tu contraseña"
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            ) : (
              // Formulario de verificación 2FA
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800">
                      {emailSent
                        ? "Se ha enviado un código de verificación a tu email:"
                        : "Enviando código de verificación a tu email:"}{" "}
                      <span className="font-medium">{formData.email}</span>
                    </p>
                    {!emailSent && (
                      <div className="flex justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twoFACode">Código de Verificación</Label>
                    <Input
                      id="twoFACode"
                      type="text"
                      required
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value)}
                      placeholder="Ingresa el código de 6 dígitos"
                      disabled={is2FALoading}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={is2FALoading || twoFACode.length !== 6}
                    >
                      {is2FALoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        "Verificar Código"
                      )}
                    </Button>

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={is2FALoading}
                        className="flex-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEmailSent(false);
                          handleRequest2FACode();
                        }}
                        disabled={is2FALoading}
                        className="flex-1"
                      >
                        {is2FALoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Reenviar Código"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enlaces adicionales */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-sky-600 hover:text-sky-500"
            >
              Regístrate aquí
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ¿Problemas para acceder?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-sky-600 hover:text-sky-500"
            >
              Recuperar contraseña
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
