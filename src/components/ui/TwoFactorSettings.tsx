"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface TwoFactorSettingsProps {
  initialEnabled?: boolean;
  onStatusChange?: (enabled: boolean) => void;
}

export default function TwoFactorSettings({
  initialEnabled = false,
  onStatusChange,
}: TwoFactorSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleActivate2FA = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ activar_2fa: true }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data?.requiere_verificacion) {
          setShowVerificationDialog(true);
          setMessage({
            type: "success",
            text: data.message,
          });
        }
      } else {
        setMessage({
          type: "error",
          text: data.message || "Error al solicitar activación de 2FA",
        });
      }
    } catch (error) {
      console.error("Error al activar 2FA:", error);
      setMessage({
        type: "error",
        text: "Error de conexión al solicitar activación",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setMessage({
        type: "error",
        text: "Por favor ingresa el código de verificación",
      });
      return;
    }

    setVerificationLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          activar_2fa: true,
          codigo_verificacion: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data?.verificacion_completada) {
          setEnabled(true);
          setShowVerificationDialog(false);
          setVerificationCode("");
          setMessage({
            type: "success",
            text: data.message,
          });
          onStatusChange?.(true);
        }
      } else {
        setMessage({
          type: "error",
          text: data.message || "Código de verificación incorrecto",
        });
      }
    } catch (error) {
      console.error("Error al verificar código:", error);
      setMessage({
        type: "error",
        text: "Error de conexión al verificar código",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleDeactivate2FA = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ activar_2fa: false }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEnabled(false);
        setMessage({
          type: "success",
          text: data.message,
        });
        onStatusChange?.(false);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Error al desactivar 2FA",
        });
      }
    } catch (error) {
      console.error("Error al desactivar 2FA:", error);
      setMessage({
        type: "error",
        text: "Error de conexión al desactivar 2FA",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Verificación en dos pasos (2FA)
          </CardTitle>
          <CardDescription>
            Agrega una capa extra de seguridad a tu cuenta requiriendo un código
            enviado a tu correo electrónico para acciones importantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="space-y-1 flex-1">
              <Label
                htmlFor="2fa-toggle"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Activar 2FA por correo electrónico
              </Label>
              <p className="text-sm text-gray-600">
                {enabled
                  ? "Tu cuenta está protegida con verificación en dos pasos"
                  : "Tu cuenta no tiene verificación en dos pasos activada"}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center space-x-3 ml-4">
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  )}
                  <div className="p-1">
                    <Switch
                      id="2fa-toggle"
                      checked={enabled}
                      disabled={loading}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {enabled ? "Desactivar" : "Activar"} verificación en dos
                    pasos
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    {enabled ? (
                      <div>
                        ¿Estás seguro de que quieres desactivar la verificación
                        en dos pasos? Esto reducirá la seguridad de tu cuenta.
                      </div>
                    ) : (
                      <div>
                        <p>
                          Al activar la verificación en dos pasos, primero
                          enviaremos un código de verificación a tu correo
                          electrónico para confirmar que puedes recibir códigos
                          2FA.
                        </p>
                        <p>
                          Una vez activado, se te pedirá un código para realizar
                          acciones importantes como:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                          <li>Iniciar sesión</li>
                          <li>Realizar reservas</li>
                          <li>Procesar pagos</li>
                          <li>Modificar tu perfil</li>
                        </ul>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={enabled ? handleDeactivate2FA : handleActivate2FA}
                    className={
                      enabled
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }
                  >
                    {enabled ? "Desactivar" : "Activar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {enabled && (
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-emerald-800">
                    2FA activado por correo electrónico
                  </h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Recibirás códigos de verificación en tu correo electrónico
                    registrado para confirmar acciones importantes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`rounded-lg p-4 border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    message.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de verificación de código */}
      <AlertDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Verificar código 2FA
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hemos enviado un código de verificación de 6 dígitos a tu correo
              electrónico. Ingrésalo a continuación para activar la verificación
              en dos pasos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="verification-code" className="text-sm font-medium">
              Código de verificación
            </Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="mt-2"
              disabled={verificationLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              El código expira en 10 minutos
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowVerificationDialog(false);
                setVerificationCode("");
                setMessage(null);
              }}
              disabled={verificationLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleVerifyCode}
              disabled={verificationLoading || !verificationCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {verificationLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Verificar código
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
