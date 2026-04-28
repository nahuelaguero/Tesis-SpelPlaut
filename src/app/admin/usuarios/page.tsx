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
  Save,
  X,
  Ban,
  Trash2,
  Unlock,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { formatDateSafe, safeText } from "@/lib/safe-format";

interface Usuario {
  _id: string;
  nombre_completo?: string | null;
  email?: string | null;
  telefono?: string | null;
  rol?: "usuario" | "propietario_cancha" | "admin" | string | null;
  fecha_registro?: string | null;
  bloqueado?: boolean | null;
  fecha_bloqueo?: string | null;
  motivo_bloqueo?: string | null;
}

interface EditingUser {
  _id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
}

export default function AdminUsuariosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
          setUsuarios(
            Array.isArray(data.data?.usuarios) ? data.data.usuarios : []
          );
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
      const response = await fetch("/api/admin/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario_id: userId, rol: newRole }),
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, rol: newRole as Usuario["rol"] } : u
          )
        );
        setMessage("Rol actualizado exitosamente.");
      } else {
        setMessage(data.message || "Error al actualizar rol.");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error al actualizar rol.");
    }
  };

  const handleToggleBlock = async (usuario: Usuario) => {
    const nextBlocked = !usuario.bloqueado;
    const userName = safeText(usuario.nombre_completo, "este usuario");
    const confirmMessage = nextBlocked
      ? `¿Bloquear a ${userName}? No podrá iniciar sesión.`
      : `¿Desbloquear a ${userName}? Podrá iniciar sesión nuevamente.`;

    if (!window.confirm(confirmMessage)) return;

    setActionLoading(`block:${usuario._id}`);
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: usuario._id,
          bloqueado: nextBlocked,
        }),
      });
      const data: {
        success: boolean;
        message?: string;
        data?: { usuario?: Usuario };
      } = await response.json();

      if (response.ok && data.success) {
        const updatedUser = data.data?.usuario;
        setUsuarios((prev) =>
          prev.map((u) =>
            u._id === usuario._id
              ? updatedUser || { ...u, bloqueado: nextBlocked }
              : u
          )
        );
        setMessage(
          nextBlocked
            ? "Usuario bloqueado exitosamente."
            : "Usuario desbloqueado exitosamente."
        );
      } else {
        setMessage(data.message || "Error al actualizar bloqueo.");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error al actualizar bloqueo.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (usuario: Usuario) => {
    const userName = safeText(usuario.nombre_completo, "este usuario");
    if (!window.confirm(`¿Eliminar definitivamente a ${userName}?`)) return;

    setActionLoading(`delete:${usuario._id}`);
    try {
      const response = await fetch(
        `/api/admin/usuarios?usuario_id=${encodeURIComponent(usuario._id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data: { success: boolean; message?: string } =
        await response.json();

      if (response.ok && data.success) {
        setUsuarios((prev) => prev.filter((u) => u._id !== usuario._id));
        setMessage("Usuario eliminado exitosamente.");
      } else {
        setMessage(data.message || "Error al eliminar usuario.");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error al eliminar usuario.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: editingUser._id,
          nombre_completo: editingUser.nombre_completo,
          email: editingUser.email,
          telefono: editingUser.telefono,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u._id === editingUser._id
              ? {
                  ...u,
                  nombre_completo: editingUser.nombre_completo,
                  email: editingUser.email,
                  telefono: editingUser.telefono,
                }
              : u
          )
        );
        setMessage("Usuario actualizado exitosamente.");
        setEditingUser(null);
      } else {
        setMessage(data.message || "Error al actualizar usuario.");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error al actualizar usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const search = searchTerm.toLowerCase();
    const nombre = safeText(usuario.nombre_completo, "");
    const email = safeText(usuario.email, "");
    const telefono = safeText(usuario.telefono, "");

    return (
      nombre.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      telefono.includes(searchTerm)
    );
  });

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
          styles[rol as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        {getRoleIcon(rol)}
        <span className="ml-1">
          {labels[rol as keyof typeof labels] || "Sin rol"}
        </span>
      </span>
    );
  };

  const getStatusBadge = (usuario: Usuario) => {
    if (!usuario.bloqueado) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <Unlock className="h-3 w-3 mr-1" />
          Activo
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <Ban className="h-3 w-3 mr-1" />
        Bloqueado
      </span>
    );
  };

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

            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push("/admin/usuarios/nuevo")}
            >
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {usuarios.filter((u) => u.bloqueado).length}
              </div>
              <p className="text-sm text-gray-600">Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de usuarios */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsuarios.map((usuario) => {
            const isCurrentUser = user._id === usuario._id;
            const blockLoading = actionLoading === `block:${usuario._id}`;
            const deleteLoading = actionLoading === `delete:${usuario._id}`;

            return (
              <Card
                key={usuario._id}
                className={`hover:shadow-md transition-shadow ${
                  usuario.bloqueado ? "border-red-200 bg-red-50/40" : ""
                }`}
              >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {safeText(usuario.nombre_completo, "Usuario sin nombre")}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {safeText(usuario.email, "Email no disponible")}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getRoleBadge(usuario.rol || "")}
                    {getStatusBadge(usuario)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {editingUser?._id === usuario._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                      <Input
                        value={editingUser.nombre_completo}
                        onChange={(e) => setEditingUser({ ...editingUser, nombre_completo: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <Input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                      <Input
                        value={editingUser.telefono}
                        onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => void handleSaveUser()}
                        disabled={savingUser}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {savingUser ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(null)}
                        disabled={savingUser}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Teléfono:</span>
                      {safeText(usuario.telefono, "No disponible")}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Registro:</span>
                      {formatDateSafe(usuario.fecha_registro)}
                    </div>

                    {usuario.bloqueado && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        Bloqueado: {formatDateSafe(usuario.fecha_bloqueo)}
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser({
                        _id: usuario._id,
                        nombre_completo: safeText(usuario.nombre_completo, ""),
                        email: safeText(usuario.email, ""),
                        telefono: safeText(usuario.telefono, ""),
                      })}
                      className="w-full text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar datos
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleToggleBlock(usuario)}
                        disabled={Boolean(actionLoading) || isCurrentUser}
                        className={
                          usuario.bloqueado
                            ? "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            : "text-amber-700 border-amber-200 hover:bg-amber-50"
                        }
                      >
                        {usuario.bloqueado ? (
                          <Unlock className="h-3 w-3 mr-1" />
                        ) : (
                          <Ban className="h-3 w-3 mr-1" />
                        )}
                        {blockLoading
                          ? "..."
                          : usuario.bloqueado
                            ? "Desbloquear"
                            : "Bloquear"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDeleteUser(usuario)}
                        disabled={Boolean(actionLoading) || isCurrentUser}
                        className="text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {deleteLoading ? "..." : "Eliminar"}
                      </Button>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cambiar Rol:
                      </label>
                      <select
                        value={usuario.rol || "usuario"}
                        onChange={(e) =>
                          handleRoleChange(usuario._id, e.target.value)
                        }
                        disabled={Boolean(actionLoading) || isCurrentUser}
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
                )}
              </CardContent>
            </Card>
            );
          })}
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
