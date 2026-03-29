"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { PricingSchedule } from "@/components/forms/PricingSchedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DiaSemana, PrecioHorario } from "@/types";
import { Settings, Save } from "lucide-react";

const days: DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

interface CanchaConfig {
  _id: string;
  nombre: string;
  descripcion: string;
  precio_por_hora: number;
  precios_por_horario: PrecioHorario[];
  imagenes: string[];
  horario_apertura: string;
  horario_cierre: string;
  dias_operativos: DiaSemana[];
  intervalo_reserva_minutos: number;
  aprobacion_automatica: boolean;
  canchas?: Array<{ _id: string; nombre: string }>;
}

export default function ConfiguracionMiCanchaPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedCanchaId, setSelectedCanchaId] = useState("");
  const [cancha, setCancha] = useState<CanchaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCancha = async (canchaId?: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        canchaId ? `/api/canchas/mi-cancha?cancha_id=${canchaId}` : "/api/canchas/mi-cancha",
        { credentials: "include" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo cargar la cancha.");
      }

      setCancha(data.data);
      setSelectedCanchaId(data.data._id);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la configuración."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol === "propietario_cancha" || user?.rol === "admin") {
      void loadCancha();
    }
  }, [user]);

  const handleSave = async () => {
    if (!cancha) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/canchas/mi-cancha", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cancha_id: cancha._id,
          nombre: cancha.nombre,
          descripcion: cancha.descripcion,
          imagenes: cancha.imagenes,
          precio_por_hora: cancha.precio_por_hora,
          precios_por_horario: cancha.precios_por_horario,
          horario_apertura: cancha.horario_apertura,
          horario_cierre: cancha.horario_cierre,
          dias_operativos: cancha.dias_operativos,
          intervalo_reserva_minutos: cancha.intervalo_reserva_minutos,
          aprobacion_automatica: cancha.aprobacion_automatica,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo guardar la configuración.");
      }

      setCancha((current) => ({
        ...data.data.cancha,
        canchas: current?.canchas || cancha?.canchas || [],
      }));
      setMessage("Configuración guardada exitosamente.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la configuración."
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Validando sesión...</div>
      </div>
    );
  }

  if (!user || (user.rol !== "propietario_cancha" && user.rol !== "admin")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Acceso denegado.</p>
      </div>
    );
  }

  if (loading || !cancha) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración de Cancha
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            Define imágenes, precios por franja y cómo se aprueban las reservas.
          </p>
        </div>

        <Button onClick={() => void handleSave()} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {cancha.canchas && cancha.canchas.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar cancha</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedCanchaId}
              onChange={(event) => void loadCancha(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {cancha.canchas.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {message && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={cancha.nombre}
              onChange={(event) =>
                setCancha((current) =>
                  current ? { ...current, nombre: event.target.value } : current
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={cancha.descripcion}
              onChange={(event) =>
                setCancha((current) =>
                  current
                    ? { ...current, descripcion: event.target.value }
                    : current
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="horario-apertura">Horario de apertura</Label>
            <Input
              id="horario-apertura"
              type="time"
              step={cancha.intervalo_reserva_minutos * 60}
              value={cancha.horario_apertura}
              onChange={(event) =>
                setCancha((current) =>
                  current
                    ? { ...current, horario_apertura: event.target.value }
                    : current
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="horario-cierre">Horario de cierre</Label>
            <Input
              id="horario-cierre"
              type="time"
              step={cancha.intervalo_reserva_minutos * 60}
              value={cancha.horario_cierre}
              onChange={(event) =>
                setCancha((current) =>
                  current
                    ? { ...current, horario_cierre: event.target.value }
                    : current
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Días operativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => {
              const active = cancha.dias_operativos.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setCancha((current) =>
                      current
                        ? {
                            ...current,
                            dias_operativos: active
                              ? current.dias_operativos.filter(
                                  (currentDay) => currentDay !== day
                                )
                              : [...current.dias_operativos, day],
                          }
                        : current
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-sm capitalize ${
                    active
                      ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            maxImages={10}
            currentImages={cancha.imagenes}
            onImagesChange={(images) =>
              setCancha((current) =>
                current ? { ...current, imagenes: images } : current
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Precios e intervalos</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingSchedule
            basePrice={cancha.precio_por_hora}
            intervalMinutes={cancha.intervalo_reserva_minutos}
            rules={cancha.precios_por_horario}
            onChange={({ basePrice, intervalMinutes, rules }) =>
              setCancha((current) =>
                current
                  ? {
                      ...current,
                      precio_por_hora: basePrice,
                      intervalo_reserva_minutos: intervalMinutes,
                      precios_por_horario: rules,
                    }
                  : current
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aprobación de reservas</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900">
              Aprobación automática
            </p>
            <p className="text-sm text-gray-600">
              Si está activado, las reservas se confirman solas cuando el horario
              está libre. Si está desactivado, quedan pendientes hasta que
              aceptes o rechaces cada solicitud.
            </p>
          </div>
          <Switch
            checked={cancha.aprobacion_automatica}
            onCheckedChange={(checked) =>
              setCancha((current) =>
                current
                  ? { ...current, aprobacion_automatica: checked }
                  : current
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
