"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggle2FA = async (newEnabled: boolean) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ activar_2fa: newEnabled }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEnabled(newEnabled);
        setMessage({
          type: "success",
          text: data.message,
        });
        onStatusChange?.(newEnabled);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Error al cambiar configuración de 2FA",
        });
      }
    } catch (error) {
      console.error("Error al cambiar 2FA:", error);
      setMessage({
        type: "error",
        text: "Error de conexión al cambiar configuración",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="2fa-toggle" className="text-sm font-medium">
              Activar 2FA por correo electrónico
            </Label>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Tu cuenta está protegida con verificación en dos pasos"
                : "Tu cuenta no tiene verificación en dos pasos activada"}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="flex items-center space-x-2">
                <Switch
                  id="2fa-toggle"
                  checked={enabled}
                  disabled={loading}
                  className="cursor-pointer"
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {enabled ? "Desactivar" : "Activar"} verificación en dos pasos
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {enabled ? (
                    <>
                      ¿Estás seguro de que quieres desactivar la verificación en
                      dos pasos? Esto reducirá la seguridad de tu cuenta.
                    </>
                  ) : (
                    <>
                      Al activar la verificación en dos pasos, se te pedirá un
                      código enviado a tu correo electrónico para realizar
                      acciones importantes como:
                      <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                        <li>Iniciar sesión</li>
                        <li>Realizar reservas</li>
                        <li>Procesar pagos</li>
                        <li>Modificar tu perfil</li>
                      </ul>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleToggle2FA(!enabled)}
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
                  message.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
