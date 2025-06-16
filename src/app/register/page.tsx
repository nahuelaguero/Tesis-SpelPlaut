"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Calendar, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { RegisterData, ApiResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  // Todos los hooks al inicio
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    nombre_completo: "",
    email: "",
    telefono: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (!loading && user) {
      // Si ya está autenticado, redirigir a la página principal
      router.push("/");
    }
  }, [user, loading, router]);

  // Mostrar loading mientras verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-gray-700 font-medium">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar el formulario
  if (user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError("");
  };

  const validateForm = (): string | null => {
    if (!formData.nombre_completo.trim()) {
      return "El nombre completo es requerido";
    }
    if (!formData.email.trim()) {
      return "El email es requerido";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Formato de email inválido";
    }
    if (!formData.telefono.trim()) {
      return "El teléfono es requerido";
    }
    if (formData.password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }
    if (formData.password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setSuccess(true);
        // Esperar un momento para mostrar el mensaje de éxito
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Error al crear la cuenta");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-900">
                  ¡Cuenta creada exitosamente!
                </h2>
                <p className="text-gray-600">
                  Tu cuenta ha sido creada correctamente. Serás redirigido al
                  login en unos segundos.
                </p>
                <Link href="/login">
                  <Button className="w-full">Ir al Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center">
            <Calendar className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-700 font-medium">
            Únete a nuestra plataforma para reservar canchas
          </p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">
              Datos de la cuenta
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Completa todos los campos para crear tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo</Label>
                <Input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.nombre_completo}
                  onChange={handleInputChange}
                  placeholder="Juan Pérez"
                  disabled={isLoading}
                />
              </div>

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
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="+595 961 123 456"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirma tu contraseña"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
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
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-700 font-medium">
                    ¿Ya tienes una cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Términos */}
        <div className="text-center text-sm text-gray-700 font-medium">
          Al crear una cuenta, aceptas nuestros{" "}
          <Link
            href="/terminos"
            className="text-emerald-600 hover:text-emerald-500 font-semibold"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacidad"
            className="text-emerald-600 hover:text-emerald-500 font-semibold"
          >
            Política de Privacidad
          </Link>
        </div>
      </div>
    </div>
  );
}
