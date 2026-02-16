"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  Smartphone,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-sky-700 to-blue-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Reserva tu cancha en
              <span className="block text-sky-200">Loma Plata</span>
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-sky-100 max-w-3xl mx-auto">
              La plataforma más fácil y rápida para reservar canchas deportivas
              en Loma Plata. Encuentra, reserva y juega en tu ciudad favorita.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/canchas">
                <Button
                  size="lg"
                  className="bg-white text-sky-700 hover:bg-gray-100 px-8 py-4 text-lg"
                >
                  Ver Canchas Disponibles
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-sky-700 px-8 py-4 text-lg"
                >
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative pattern */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-12 text-white"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1200 120L0 16.48V0h1200z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              ¿Por qué elegir SpelPlaut?
            </h2>
            <p className="mt-4 text-xl text-gray-700 font-medium max-w-3xl mx-auto">
              Ofrecemos la mejor experiencia para reservar canchas deportivas
              con tecnología moderna y facilidad de uso.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <Clock className="h-8 w-8 text-sky-700" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Reserva Instantánea
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 font-medium">
                  Reserva tu cancha en tiempo real y recibe confirmación
                  inmediata. Sin esperas, sin llamadas telefónicas.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <MapPin className="h-8 w-8 text-sky-700" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Múltiples Ubicaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 font-medium">
                  Encuentra canchas cerca de ti en toda la ciudad. Filtra por
                  ubicación, tipo y disponibilidad.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <Shield className="h-8 w-8 text-sky-700" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Pago Seguro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 font-medium">
                  Múltiples métodos de pago seguros. Paga online o en el lugar.
                  Reembolsos garantizados en caso de cancelación.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <Smartphone className="h-8 w-8 text-sky-700" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  App Móvil PWA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 font-medium">
                  Acceso desde cualquier dispositivo. Instala nuestra app web y
                  gestiona tus reservas desde donde estés.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <Users className="h-8 w-8 text-sky-700" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Gestión Grupal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 font-medium">
                  Organiza partidos con amigos. Comparte costos y gestiona
                  reservas grupales de forma fácil.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="bg-sky-100 p-3 rounded-full">
                    <Calendar className="h-8 w-8 text-sky-700" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Recordatorios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 font-medium">
                  Recibe notificaciones de tus próximas reservas. Nunca te
                  pierdas un partido.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Cómo funciona
            </h2>
            <p className="mt-4 text-xl text-gray-700 font-medium">
              Reservar una cancha nunca fue tan fácil
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                  1
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Busca y Selecciona
              </h3>
              <p className="mt-4 text-gray-700 font-medium">
                Explora las canchas disponibles, revisa fotos, precios y
                horarios. Filtra por ubicación y tipo de deporte.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                  2
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Reserva y Paga
              </h3>
              <p className="mt-4 text-gray-700 font-medium">
                Selecciona fecha y hora, completa tus datos y realiza el pago de
                forma segura online o en el lugar.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                  3
                </div>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Juega y Disfruta
              </h3>
              <p className="mt-4 text-gray-700 font-medium">
                Recibe confirmación inmediata y un recordatorio antes de tu
                partido. ¡Solo queda disfrutar del juego!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 font-medium mb-4">
                  &ldquo;Increíble facilidad para reservar. Ya no tengo que
                  llamar a cada cancha para preguntar disponibilidad. ¡Lo
                  recomiendo!&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sky-700 font-semibold">JG</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Juan González</p>
                    <p className="text-sm text-gray-700 font-medium">
                      Jugador frecuente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 font-medium mb-4">
                  &ldquo;Como administrador de cancha, esta plataforma me ha
                  facilitado mucho la gestión de reservas y pagos.&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sky-700 font-semibold">MS</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">María Silva</p>
                    <p className="text-sm text-gray-700 font-medium">
                      Propietaria de cancha
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 font-medium mb-4">
                  &ldquo;La app es súper intuitiva y los recordatorios me ayudan
                  a no olvidar mis partidos. ¡Excelente servicio!&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sky-700 font-semibold">PR</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">
                      Pedro Rodríguez
                    </p>
                    <p className="text-sm text-gray-700 font-medium">
                      Usuario habitual
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            ¿Listo para reservar tu próxima cancha?
          </h2>
          <p className="mt-4 text-xl text-sky-100 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya disfrutan de la forma más fácil de
            reservar canchas deportivas.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-sky-700 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Crear Cuenta Gratis
                <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/canchas">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-sky-700 px-8 py-4 text-lg"
              >
                Explorar Canchas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sección SpelPlaut */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-sky-50 to-blue-100 rounded-xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              ¿Qué significa SpelPlaut?
            </h2>
            <div className="space-y-6 text-lg text-gray-700">
              <p>
                <span className="font-semibold text-sky-700">
                  SpelPlaut
                </span>{" "}
                combina dos palabras que representan la esencia de nuestra
                comunidad en Loma Plata:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-sky-700 mb-2">
                    Spel
                  </h3>
                  <p className="text-gray-700 font-medium">
                    Significa <strong>&ldquo;juego&rdquo;</strong> o{" "}
                    <strong>&ldquo;jugar&rdquo;</strong> en Plautdietsch
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-sky-700 mb-2">
                    Plaut
                  </h3>
                  <p className="text-gray-700 font-medium">
                    Viene de <strong>&ldquo;Plautdietsch&rdquo;</strong>, el
                    dialecto tradicional de nuestros ancestros menonitas
                  </p>
                </div>
              </div>
              <p>
                Así, <span className="font-semibold">SpelPlaut</span> representa
                la unión entre el deporte que amamos y las raíces culturales que
                nos definen como comunidad en Loma Plata. ¡Una app hecha con
                orgullo local!
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
