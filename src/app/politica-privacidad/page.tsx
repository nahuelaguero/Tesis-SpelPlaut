"use client";

import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Lock,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function PoliticaPrivacidadPage() {
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
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Política de Privacidad
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
                <Eye className="h-5 w-5 text-emerald-600" />
                1. Introducción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                En <strong>SpelPlaut</strong>, valoramos y respetamos su
                privacidad. Esta Política de Privacidad explica cómo
                recopilamos, usamos, protegemos y compartimos su información
                personal cuando utiliza nuestros servicios.
              </p>
              <p className="text-gray-700">
                Al usar SpelPlaut, usted consiente las prácticas descritas en
                esta política. Si no está de acuerdo con estas prácticas, no
                debe usar nuestro servicio.
              </p>
            </CardContent>
          </Card>

          {/* Información que Recopilamos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                2. Información que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  2.1 Información Personal
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Nombre completo y fecha de nacimiento</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono</li>
                  <li>Información de pago (procesada de forma segura)</li>
                  <li>Preferencias de reserva y deportes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  2.2 Información de Ubicación
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Ubicación aproximada (con su consentimiento)</li>
                  <li>Direcciones de canchas visitadas</li>
                  <li>Datos de geolocalización para mejorar recomendaciones</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  2.3 Información de Uso
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Historial de reservas y transacciones</li>
                  <li>Interacciones con la plataforma</li>
                  <li>Preferencias y configuraciones de cuenta</li>
                  <li>Información del dispositivo y navegador</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cómo Usamos la Información */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                3. Cómo Usamos su Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  3.1 Provisión de Servicios
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Procesar y confirmar reservas</li>
                  <li>Facilitar pagos y transacciones</li>
                  <li>Proporcionar atención al cliente</li>
                  <li>Enviar confirmaciones y recordatorios</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  3.2 Mejora del Servicio
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Personalizar recomendaciones de canchas</li>
                  <li>Analizar patrones de uso para mejoras</li>
                  <li>Desarrollar nuevas funcionalidades</li>
                  <li>Optimizar la experiencia del usuario</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  3.3 Comunicación
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Enviar notificaciones importantes del servicio</li>
                  <li>Responder a consultas y solicitudes</li>
                  <li>Informar sobre cambios en términos o políticas</li>
                  <li>Ofertas especiales (solo con su consentimiento)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Protección de Datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                4. Protección de sus Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  4.1 Medidas de Seguridad
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Encriptación SSL/TLS para todas las transmisiones</li>
                  <li>Autenticación de dos factores (2FA) disponible</li>
                  <li>Almacenamiento seguro en servidores protegidos</li>
                  <li>Acceso limitado solo a personal autorizado</li>
                  <li>Monitoreo continuo de seguridad</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  4.2 Retención de Datos
                </h4>
                <p className="text-gray-700">
                  Conservamos su información personal solo durante el tiempo
                  necesario para proporcionar nuestros servicios y cumplir con
                  obligaciones legales. Los datos de reservas se mantienen por 5
                  años para fines contables.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compartir Información */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                5. Compartir su Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  5.1 Con Propietarios de Canchas
                </h4>
                <p className="text-gray-700">
                  Compartimos información necesaria (nombre, teléfono, fecha de
                  reserva) con los propietarios de canchas para facilitar su
                  reserva.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  5.2 Proveedores de Servicios
                </h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Procesadores de pago (datos encriptados)</li>
                  <li>Servicios de hosting y almacenamiento</li>
                  <li>Servicios de email y notificaciones</li>
                  <li>Análisis y métricas (datos anonimizados)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  5.3 Requisitos Legales
                </h4>
                <p className="text-gray-700">
                  Podemos divulgar información si es requerido por ley, orden
                  judicial, o para proteger nuestros derechos, propiedad, o la
                  seguridad de nuestros usuarios.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sus Derechos */}
          <Card>
            <CardHeader>
              <CardTitle>6. Sus Derechos de Privacidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">Usted tiene derecho a:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>
                  <strong>Acceder</strong> a su información personal
                </li>
                <li>
                  <strong>Corregir</strong> datos inexactos o incompletos
                </li>
                <li>
                  <strong>Eliminar</strong> su cuenta y datos personales
                </li>
                <li>
                  <strong>Restringir</strong> el procesamiento de sus datos
                </li>
                <li>
                  <strong>Portabilidad</strong> de datos a otro servicio
                </li>
                <li>
                  <strong>Oponerse</strong> al procesamiento para marketing
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                Para ejercer estos derechos, contáctanos a través de los medios
                proporcionados en la sección de contacto.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>7. Cookies y Tecnologías Similares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Mantener su sesión iniciada</li>
                <li>Recordar sus preferencias</li>
                <li>Analizar el uso del sitio</li>
                <li>Mejorar la funcionalidad</li>
              </ul>
              <p className="text-gray-700">
                Puede configurar su navegador para rechazar cookies, aunque esto
                puede afectar la funcionalidad del sitio.
              </p>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                8. Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-700">
                Para preguntas sobre esta política de privacidad o el manejo de
                sus datos:
              </p>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p>
                  <strong>Oficial de Privacidad:</strong> SpelPlaut Privacy Team
                </p>
                <p>
                  <strong>Email:</strong> privacidad@spelplaut.com
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
            <Shield className="h-4 w-4" />
            Imprimir política
          </Button>
          <Link href="/terminos-condiciones">
            <Button variant="outline" className="w-full sm:w-auto">
              Ver Términos y Condiciones
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
