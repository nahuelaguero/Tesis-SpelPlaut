"use client";

import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Shield,
  CreditCard,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/"
              className="flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Términos y Condiciones
              </h1>
              <p className="text-gray-600">
                Última actualización:{" "}
                {new Date().toLocaleDateString("es-PY", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Introducción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                1. Introducción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Bienvenido a <strong>SpelPlaut</strong>, la plataforma digital
                de reservas de canchas deportivas para la comunidad de Loma
                Plata y el Chaco paraguayo. Estos términos y condiciones
                (&quot;Términos&quot;) rigen el uso de nuestro sitio web y
                servicios.
              </p>
              <p className="text-gray-700">
                Al acceder y usar SpelPlaut, usted acepta estar sujeto a estos
                Términos. Si no está de acuerdo con alguna parte de estos
                términos, no debe usar nuestro servicio.
              </p>
            </CardContent>
          </Card>

          {/* Definiciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                2. Definiciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900">Usuario:</h4>
                <p className="text-gray-700">
                  Persona que utiliza la plataforma para reservar canchas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Propietario:</h4>
                <p className="text-gray-700">
                  Persona o entidad que administra una o más canchas en la
                  plataforma.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Servicio:</h4>
                <p className="text-gray-700">
                  La plataforma SpelPlaut y todos sus servicios relacionados.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Reserva:</h4>
                <p className="text-gray-700">
                  Solicitud confirmada para usar una cancha en fecha y hora
                  específica.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Uso del Servicio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                3. Uso del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  3.1 Registro de Usuario
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Debe proporcionar información precisa y actualizada</li>
                  <li>
                    Es responsable de mantener la confidencialidad de su cuenta
                  </li>
                  <li>
                    Debe notificar inmediatamente cualquier uso no autorizado
                  </li>
                  <li>
                    Debe ser mayor de 18 años o tener autorización parental
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">3.2 Reservas</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Las reservas están sujetas a disponibilidad</li>
                  <li>Se requiere confirmación para todas las reservas</li>
                  <li>
                    Los horarios mostrados corresponden a la zona horaria local
                  </li>
                  <li>El usuario debe llegar puntualmente a su reserva</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pagos y Cancelaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                4. Pagos y Cancelaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  4.1 Métodos de Pago
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Aceptamos efectivo y tarjetas de crédito/débito</li>
                  <li>Los precios se muestran en Guaraníes (PYG)</li>
                  <li>El pago se procesa al confirmar la reserva</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  4.2 Política de Cancelación
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Cancelación gratuita hasta 24 horas antes del evento</li>
                  <li>
                    Cancelaciones con menos de 24 horas: se aplicará cargo del
                    50%
                  </li>
                  <li>
                    No-show (no presentarse): se cobrará el 100% del servicio
                  </li>
                  <li>Reembolsos se procesan en 3-5 días hábiles</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Responsabilidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-emerald-600" />
                5. Responsabilidades y Limitaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  5.1 Responsabilidad del Usuario
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Usar las instalaciones de manera responsable</li>
                  <li>Respetar las reglas específicas de cada cancha</li>
                  <li>Reportar cualquier daño o problema inmediatamente</li>
                  <li>No realizar actividades ilegales o peligrosas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  5.2 Limitación de Responsabilidad
                </h4>
                <p className="text-gray-700">
                  SpelPlaut actúa como intermediario entre usuarios y
                  propietarios de canchas. No somos responsables por lesiones,
                  daños a la propiedad, o disputas que puedan surgir durante el
                  uso de las instalaciones.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Modificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>6. Modificaciones de los Términos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Nos reservamos el derecho de modificar estos términos en
                cualquier momento. Los cambios serán efectivos inmediatamente
                después de su publicación en el sitio web. El uso continuado del
                servicio constituye aceptación de los términos modificados.
              </p>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>7. Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-700">
                Para preguntas sobre estos términos, contáctanos:
              </p>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p>
                  <strong>Email:</strong> soporte@spelplaut.com
                </p>
                <p>
                  <strong>Teléfono:</strong> +595 (492) 252-XXX
                </p>
                <p>
                  <strong>Dirección:</strong> Loma Plata, Chaco, Paraguay
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Imprimir términos
          </Button>
          <Link href="/politica-privacidad">
            <Button variant="outline" className="w-full sm:w-auto">
              Ver Política de Privacidad
            </Button>
          </Link>
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
