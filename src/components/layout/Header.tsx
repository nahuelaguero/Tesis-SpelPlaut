"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Mostrar loading state
  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-emerald-600 text-white p-2 rounded-lg">
                  <span className="font-bold text-sm">SP</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">
                    SpelPlaut
                  </span>
                  <span className="text-xs text-gray-700 font-medium hidden sm:block">
                    Spel en Loma Plata
                  </span>
                </div>
              </Link>
            </div>
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-emerald-600 text-white p-2 rounded-lg">
                <span className="font-bold text-sm">SP</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">
                  SpelPlaut
                </span>
                <span className="text-xs text-gray-700 font-medium hidden sm:block">
                  Spel en Loma Plata
                </span>
              </div>
            </Link>
          </div>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Usuarios normales y admins pueden ver canchas */}
            {(!user || user.rol === "usuario" || user.rol === "admin") && (
              <Link
                href="/canchas"
                className="text-gray-700 hover:text-emerald-600 transition-colors"
              >
                Canchas
              </Link>
            )}

            {user && (
              <>
                {/* Usuarios normales y admins pueden ver reservas */}
                {(user.rol === "usuario" || user.rol === "admin") && (
                  <Link
                    href="/mis-reservas"
                    className="text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    {user.rol === "admin"
                      ? "Todas las Reservas"
                      : "Mis Reservas"}
                  </Link>
                )}

                {/* Solo propietarios pueden ver su cancha */}
                {user.rol === "propietario_cancha" && (
                  <Link
                    href="/mi-cancha"
                    className="text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Mi Cancha
                  </Link>
                )}

                {/* Solo admins pueden ver administración */}
                {user.rol === "admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Administración
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Botones de autenticación */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/perfil"
                  className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{user.nombre_completo}</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Usuarios normales y admins pueden ver canchas */}
              {(!user || user.rol === "usuario" || user.rol === "admin") && (
                <Link
                  href="/canchas"
                  className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Canchas
                </Link>
              )}

              {user && (
                <>
                  {/* Usuarios normales y admins pueden ver reservas */}
                  {(user.rol === "usuario" || user.rol === "admin") && (
                    <Link
                      href="/mis-reservas"
                      className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {user.rol === "admin"
                        ? "Todas las Reservas"
                        : "Mis Reservas"}
                    </Link>
                  )}

                  {/* Solo propietarios pueden ver su cancha */}
                  {user.rol === "propietario_cancha" && (
                    <Link
                      href="/mi-cancha"
                      className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Mi Cancha
                    </Link>
                  )}

                  {/* Solo admins pueden ver administración */}
                  {user.rol === "admin" && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-gray-700 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Administración
                    </Link>
                  )}
                </>
              )}
              <div className="border-t border-gray-200 pt-2">
                {user ? (
                  <div className="px-3 py-2 space-y-2">
                    <Link
                      href="/perfil"
                      className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>{user.nombre_completo}</span>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                ) : (
                  <div className="px-3 py-2 space-y-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
