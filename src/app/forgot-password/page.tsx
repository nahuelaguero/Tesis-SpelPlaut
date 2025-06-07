"use client";

import { useState } from "react";
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
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!email) {
      setMessage("Por favor ingresa tu email");
      setLoading(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Por favor ingresa un email válido");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage(
          "Se ha enviado un email con instrucciones para restablecer tu contraseña"
        );
      } else {
        setMessage(data.message || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error de conexión. Intenta nuevamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center mb-4">
              <Link
                href="/login"
                className="flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al login
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              ¿Olvidaste tu contraseña?
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {success
                ? "Te hemos enviado las instrucciones"
                : "Ingresa tu email y te enviaremos instrucciones para restablecerla"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 bg-emerald-50 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm text-emerald-700">{message}</p>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Revisa tu bandeja de entrada y sigue las instrucciones
                  </p>
                  <p className="text-xs text-gray-500">
                    ¿No recibiste el email? Revisa tu carpeta de spam
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false);
                      setMessage("");
                      setEmail("");
                    }}
                    className="flex-1"
                  >
                    Enviar otro email
                  </Button>
                  <Button
                    onClick={() => router.push("/login")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Ir al login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {message && !success && (
                  <div className="flex items-center space-x-2 bg-red-50 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">{message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    ¿Recordaste tu contraseña? Inicia sesión
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda?{" "}
            <Link
              href="/contacto"
              className="text-emerald-600 hover:text-emerald-700"
            >
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
