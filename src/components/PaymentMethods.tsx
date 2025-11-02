"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Smartphone,
  QrCode,
  Banknote,
  Apple,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PaymentMethodsProps {
  amount: number;
  onPaymentSelect: (method: string) => void;
  selectedMethod: string;
}

const PaymentMethods = ({
  amount,
  onPaymentSelect,
  selectedMethod,
}: PaymentMethodsProps) => {
  const [showDigitalPayments, setShowDigitalPayments] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const paymentOptions = [
    {
      id: "bancard_card",
      title: "Tarjeta de Débito/Crédito",
      description: "Visa, Mastercard y otras tarjetas",
      icon: <CreditCard className="h-6 w-6" />,
      category: "digital",
      instant: true,
    },
    {
      id: "bancard_apple_pay",
      title: "Apple Pay",
      description: "Pago rápido y seguro con Touch ID/Face ID",
      icon: <Apple className="h-6 w-6" />,
      category: "digital",
      instant: true,
    },
    {
      id: "bancard_google_pay",
      title: "Google Pay",
      description: "Pago rápido con tu dispositivo Android",
      icon: <Smartphone className="h-6 w-6" />,
      category: "digital",
      instant: true,
    },
    {
      id: "bancard_qr",
      title: "Pago con QR",
      description: "Escanea el código QR con tu app bancaria",
      icon: <QrCode className="h-6 w-6" />,
      category: "digital",
      instant: true,
    },
    {
      id: "efectivo",
      title: "Pago en Efectivo",
      description: "Paga al llegar a la cancha",
      icon: <Banknote className="h-6 w-6" />,
      category: "cash",
      instant: false,
    },
  ];

  const digitalMethods = paymentOptions.filter(
    (option) => option.category === "digital"
  );
  const cashMethods = paymentOptions.filter(
    (option) => option.category === "cash"
  );

  return (
    <div className="space-y-6">
      {/* Header con total */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-800">Total a Pagar</CardTitle>
          <CardDescription className="text-2xl font-bold text-emerald-900">
            {formatPrice(amount)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Métodos digitales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagos Digitales
              </CardTitle>
              <CardDescription>
                Procesados por Bancard - Confirmación inmediata
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDigitalPayments(!showDigitalPayments)}
              className="flex items-center gap-2"
            >
              {showDigitalPayments ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver opciones
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showDigitalPayments && (
          <CardContent>
            <div className="space-y-3">
              {digitalMethods.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    id={option.id}
                    name="payment-method"
                    value={option.id}
                    checked={selectedMethod === option.id}
                    onChange={() => onPaymentSelect(option.id)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-emerald-600">{option.icon}</div>
                    <div className="flex-1">
                      <Label
                        htmlFor={option.id}
                        className="font-medium text-gray-900 cursor-pointer"
                      >
                        {option.title}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                    {option.instant && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        Instantáneo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Método de efectivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Pago en Efectivo
          </CardTitle>
          <CardDescription>Reserva ahora, paga al llegar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cashMethods.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  id={option.id}
                  name="payment-method"
                  value={option.id}
                  checked={selectedMethod === option.id}
                  onChange={() => onPaymentSelect(option.id)}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-amber-600">{option.icon}</div>
                  <div className="flex-1">
                    <Label
                      htmlFor={option.id}
                      className="font-medium text-gray-900 cursor-pointer"
                    >
                      {option.title}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    Al llegar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      {selectedMethod && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              {selectedMethod === "efectivo" ? (
                <div>
                  <p className="font-medium mb-2">💡 Información importante:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Tu reserva quedará confirmada</li>
                    <li>• Puedes pagar al llegar a la cancha</li>
                    <li>• Lleva el monto exacto si es posible</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="font-medium mb-2">🔒 Pago seguro:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Procesado por Bancard</li>
                    <li>• Confirmación inmediata</li>
                    <li>• Datos protegidos con encriptación</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentMethods;
