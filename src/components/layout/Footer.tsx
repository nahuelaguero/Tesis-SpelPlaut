"use client";

import Link from "next/link";
import { Heart, Shield, FileText, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información de la empresa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <h3 className="text-xl font-bold">SpelPlaut</h3>
            </div>
            <p className="text-gray-400 text-sm">
              La plataforma digital para reservar canchas deportivas en Loma
              Plata y el Chaco paraguayo. Spel (jugar) en tu comunidad.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:soporte@spelplaut.com"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="tel:+595492252000"
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
            <nav className="space-y-2">
              <Link
                href="/canchas"
                className="block text-gray-400 hover:text-emerald-400 transition-colors text-sm"
              >
                Ver Canchas
              </Link>
              <Link
                href="/mis-reservas"
                className="block text-gray-400 hover:text-emerald-400 transition-colors text-sm"
              >
                Mis Reservas
              </Link>
              <Link
                href="/perfil"
                className="block text-gray-400 hover:text-emerald-400 transition-colors text-sm"
              >
                Mi Perfil
              </Link>
              <Link
                href="/dashboard"
                className="block text-gray-400 hover:text-emerald-400 transition-colors text-sm"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Información legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <nav className="space-y-2">
              <Link
                href="/terminos-condiciones"
                className="flex items-center space-x-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Términos y Condiciones</span>
              </Link>
              <Link
                href="/politica-privacidad"
                className="flex items-center space-x-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm"
              >
                <Shield className="h-4 w-4" />
                <span>Política de Privacidad</span>
              </Link>
            </nav>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Loma Plata
                  <br />
                  Chaco, Paraguay
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+595 (492) 252-XXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>soporte@spelplaut.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria y copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>
                © {currentYear} SpelPlaut. Todos los derechos reservados.
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>Hecho con</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>para la comunidad de Loma Plata</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
