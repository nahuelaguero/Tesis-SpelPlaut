"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  Edit,
  Shield,
  User,
} from "lucide-react";
import Header from "@/components/layout/Header";

interface Usuario {
  _id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: "usuario" | "propietario_cancha" | "admin";
  fecha_registro: string;
}

export default function AdminUsuariosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  // Verificar permisos
  useEffect(() => {
    if (!loading && (!user || user.rol !== "admin")) {
      router.push("/");
      return;
    }

    if (user && user.rol === "admin") {
      loadUsuarios();
    }
  }, [user, loading, router]);

  const loadUsuarios = async () => {
    try {
      const response = await fetch("/api/admin/usuarios", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsuarios(data.data.usuarios || []);
        } else {
          setMessage(data.message || "Error al cargar usuarios");
        }
      } else {
        setMessage("Error al obtener usuarios");
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setMessage("Error de conexión al cargar usuarios");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setMessage(`Rol actualizado para usuario ${userId} a ${newRole}`);
      // Aquí iría la llamada al API real
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error al actualizar rol");
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    return (
      usuario.nombre_completo
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.telefono.includes(searchTerm)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case "admin":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "propietario_cancha":
        return <Edit className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRoleBadge = (rol: string) => {
    const styles = {
      usuario: "bg-blue-100 text-blue-800",
      propietario_cancha: "bg-green-100 text-green-800",
      admin: "bg-purple-100 text-purple-800",
    };

    const labels = {
      usuario: "Usuario",
      propietario_cancha: "Propietario",
      admin: "Admin",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          styles[rol as keyof typeof styles]
        }`}
      >
        {getRoleIcon(rol)}
        <span className="ml-1">{labels[rol as keyof typeof labels]}</span>
      </span>
    );
  };

  // Verificar permisos
  if (!user || user.rol !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              Solo los administradores pueden acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || loadingUsuarios) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <Button
                variant="outline"
                onClick={() => router.push("/admin")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Users className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-600">
                  Administra todos los usuarios del sistema
                </p>
              </div>
            </div>

            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Agregar Usuario</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-700">{message}</p>
            </div>
          )}

          {/* Buscador */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">
                {usuarios.length}
              </div>
              <p className="text-sm text-gray-600">Total usuarios</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {usuarios.filter((u) => u.rol === "propietario_cancha").length}
              </div>
              <p className="text-sm text-gray-600">Propietarios</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {usuarios.filter((u) => u.rol === "usuario").length}
              </div>
              <p className="text-sm text-gray-600">Usuarios</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de usuarios */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsuarios.map((usuario) => (
            <Card
              key={usuario._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {usuario.nombre_completo}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {usuario.email}
                    </CardDescription>
                  </div>
                  {getRoleBadge(usuario.rol)}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Teléfono:</span>
                    {usuario.telefono}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Registro:</span>
                    {formatDate(usuario.fecha_registro)}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cambiar Rol:
                    </label>
                    <select
                      value={usuario.rol}
                      onChange={(e) =>
                        handleRoleChange(usuario._id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="propietario_cancha">
                        Propietario de Cancha
                      </option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsuarios.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm
                  ? "No se encontraron usuarios con ese término de búsqueda"
                  : "No hay usuarios registrados"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
