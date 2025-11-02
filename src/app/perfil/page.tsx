"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Key,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import TwoFactorSettings from "@/components/ui/TwoFactorSettings";

interface UserProfile {
  _id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  fecha_registro: string;
  rol: string;
  autenticacion_2FA: boolean;
}

export default function PerfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "security"
  >("profile");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Estados del formulario de perfil
  const [profileForm, setProfileForm] = useState({
    nombre_completo: "",
    telefono: "",
  });

  // Estados del formulario de contraseña
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    // No redirigir mientras AuthContext está cargando
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProfile(data.data);
            setProfileForm({
              nombre_completo: data.data.nombre_completo || "",
              telefono: data.data.telefono || "",
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
        setMessage({
          type: "error",
          text: "Error al cargar información del perfil",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, authLoading]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: "Perfil actualizado exitosamente",
        });

        // Actualizar el estado local
        setProfile((prev) => (prev ? { ...prev, ...profileForm } : null));
      } else {
        setMessage({
          type: "error",
          text: data.message || "Error al actualizar perfil",
        });
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage({
        type: "error",
        text: "Error de conexión al actualizar perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage(null);

    // Validaciones del lado del cliente
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({
        type: "error",
        text: "Las contraseñas nuevas no coinciden",
      });
      setChangingPassword(false);
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({
        type: "error",
        text: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      setChangingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: "success",
          text: "Contraseña cambiada exitosamente",
        });
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Error al cambiar contraseña",
        });
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setMessage({
        type: "error",
        text: "Error de conexión al cambiar contraseña",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error al cargar perfil
            </h2>
            <Button onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-600">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Navegación de pestañas */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Key className="h-4 w-4 mr-2" />
            Contraseña
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "security"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal y datos de contacto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="email"
                      className="font-semibold text-gray-900"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      El email no se puede modificar
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="rol"
                      className="font-semibold text-gray-900"
                    >
                      Rol
                    </Label>
                    <Input
                      id="rol"
                      value={
                        profile.rol === "admin" ? "Administrador" : "Usuario"
                      }
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="nombre_completo"
                      className="font-semibold text-gray-900"
                    >
                      Nombre Completo *
                    </Label>
                    <Input
                      id="nombre_completo"
                      type="text"
                      value={profileForm.nombre_completo}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          nombre_completo: e.target.value,
                        }))
                      }
                      required
                      placeholder="Tu nombre completo"
                      className="bg-white text-gray-900 placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="telefono"
                      className="font-semibold text-gray-900"
                    >
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={profileForm.telefono}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          telefono: e.target.value,
                        }))
                      }
                      placeholder="+595 xxx xxx xxx"
                      className="bg-white text-gray-900 placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="fecha_registro"
                      className="font-semibold text-gray-900"
                    >
                      Fecha de Registro
                    </Label>
                    <Input
                      id="fecha_registro"
                      value={new Date(
                        profile.fecha_registro
                      ).toLocaleDateString("es-PY")}
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "password" && (
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <Label
                    htmlFor="current_password"
                    className="font-semibold text-gray-900"
                  >
                    Contraseña Actual *
                  </Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          current_password: e.target.value,
                        }))
                      }
                      required
                      placeholder="Tu contraseña actual"
                      className="pr-10 bg-white text-gray-900 placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="new_password"
                    className="font-semibold text-gray-900"
                  >
                    Nueva Contraseña *
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          new_password: e.target.value,
                        }))
                      }
                      required
                      placeholder="Tu nueva contraseña"
                      minLength={6}
                      className="pr-10 bg-white text-gray-900 placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="confirm_password"
                    className="font-semibold text-gray-900"
                  >
                    Confirmar Nueva Contraseña *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                      required
                      placeholder="Confirma tu nueva contraseña"
                      className="pr-10 bg-white text-gray-900 placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {changingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cambiando...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Cambiar Contraseña
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "security" && profile && (
          <TwoFactorSettings
            initialEnabled={profile.autenticacion_2FA}
            onStatusChange={(enabled) => {
              setProfile((prev) =>
                prev ? { ...prev, autenticacion_2FA: enabled } : null
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
