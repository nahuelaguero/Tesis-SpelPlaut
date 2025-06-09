"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, X, AlertCircle, Smartphone } from "lucide-react";

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
  onSkip: () => void;
}

export function PermissionDialog({
  isOpen,
  onClose,
  onRequestPermission,
  onSkip,
}: PermissionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Permitir acceso a ubicación
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Para brindarte la mejor experiencia, nos gustaría acceder a tu
            ubicación para:
          </p>

          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>Mostrar canchas cercanas a ti</span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>Calcular distancias y tiempos de viaje</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>Filtrar resultados por proximidad</span>
            </li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Tu privacidad es importante:</strong> Solo usamos tu
              ubicación para mejorar tu experiencia. No almacenamos ni
              compartimos esta información.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onRequestPermission} className="flex-1">
              <MapPin className="h-4 w-4 mr-2" />
              Permitir ubicación
            </Button>
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Continuar sin ubicación
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Puedes cambiar estos permisos en cualquier momento desde la
            configuración del navegador
          </p>
        </div>
      </Card>
    </div>
  );
}
