"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import PaymentMethods from "@/components/PaymentMethods";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReservaCreated?: (reserva: ReservaCreada) => void;
  canchaId: string;
  fecha: string;
  horaInicio: string;
  precioHora: number;
  nombreCancha: string;
}

interface ReservaCreada {
  _id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_total: number;
}

export function ReservaModal({
  isOpen,
  onClose,
  onReservaCreated,
  canchaId,
  fecha,
  horaInicio,
  precioHora,
  nombreCancha,
}: ReservaModalProps) {
  const { user } = useAuth();
  const [duracion, setDuracion] = useState(1);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const calculateEndTime = () => {
    const [hours, minutes] = horaInicio.split(":").map(Number);
    const endHours = hours + duracion;
    return `${endHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateTotal = () => {
    return precioHora * duracion;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Debes iniciar sesión para hacer una reserva");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cancha_id: canchaId,
          fecha_reserva: fecha,
          hora_inicio: horaInicio,
          hora_fin: calculateEndTime(),
          precio_total: calculateTotal(),
          metodo_pago: metodoPago,
          notas: notas || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (onReservaCreated) {
          onReservaCreated({
            _id: data.data.reserva._id,
            fecha: fecha,
            hora_inicio: horaInicio,
            hora_fin: calculateEndTime(),
            precio_total: calculateTotal(),
          });
        }

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setNotas("");
          setDuracion(1);
          setMetodoPago("efectivo");
        }, 2000);
      } else {
        setError(data.message || "Error al crear la reserva");
      }
    } catch {
      setError("Error de conexión al crear la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setSuccess(false);
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              ¡Reserva Confirmada!
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-6">
            <div className="text-green-600 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tu reserva ha sido confirmada
            </h3>
            <p className="text-gray-600">
              Recibirás un email de confirmación con todos los detalles.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Confirmar Reserva
          </DialogTitle>
          <DialogDescription>
            Completa los detalles de tu reserva para {nombreCancha}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumen de la reserva */}
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-semibold text-emerald-800 mb-3">
              Resumen de la reserva
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span className="font-medium">{formatDate(fecha)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hora inicio:</span>
                <span className="font-medium">{horaInicio}</span>
              </div>
              <div className="flex justify-between">
                <span>Hora fin:</span>
                <span className="font-medium">{calculateEndTime()}</span>
              </div>
              <div className="flex justify-between">
                <span>Duración:</span>
                <span className="font-medium">
                  {duracion} hora{duracion !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <Badge variant="outline" className="text-emerald-600">
                  {formatPrice(calculateTotal())}
                </Badge>
              </div>
            </div>
          </div>

          {/* Duración */}
          <div>
            <Label htmlFor="duracion">Duración (horas)</Label>
            <select
              id="duracion"
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={1}>1 hora</option>
              <option value={2}>2 horas</option>
              <option value={3}>3 horas</option>
              <option value={4}>4 horas</option>
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <Label className="text-base font-medium">Método de pago</Label>
            <div className="mt-2">
              <PaymentMethods
                amount={calculateTotal()}
                selectedMethod={metodoPago}
                onPaymentSelect={setMetodoPago}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notas">Comentarios (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Información adicional para tu reserva..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={300}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {notas.length}/300 caracteres
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !user}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Procesando...</span>
                </>
              ) : !user ? (
                "Inicia sesión"
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Confirmar reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
