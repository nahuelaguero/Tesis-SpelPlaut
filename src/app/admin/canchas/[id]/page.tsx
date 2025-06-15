"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Edit,
  Camera,
} from "lucide-react";
import Header from "@/components/layout/Header";

interface FormData {
  nombre: string;
  descripcion: string;
  tipo_cancha: string;
  ubicacion: string;
  precio_por_hora: string;
  capacidad_jugadores: string;
  horario_apertura: string;
  horario_cierre: string;
  disponible: boolean;
}

export default function EditarCanchaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const canchaId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    descripcion: "",
    tipo_cancha: "",
    ubicacion: "",
    precio_por_hora: "",
    capacidad_jugadores: "",
    horario_apertura: "06:00",
    horario_cierre: "22:00",
    disponible: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingCancha, setLoadingCancha] = useState(true);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  const tiposCancha = [
    { value: "Football11", label: "Fútbol 11" },
    { value: "Football5", label: "Fútbol 5" },
    { value: "Tennis", label: "Tenis" },
    { value: "Basketball", label: "Básquet" },
    { value: "Padel", label: "Pádel" },
    { value: "Volleyball", label: "Vóley" },
  ];

  const loadCancha = useCallback(async () => {
    try {
      const response = await fetch(`/api/canchas/${canchaId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const cancha = data.data.cancha;

          // Mapear los datos de la cancha al formulario
          setFormData({
            nombre: cancha.nombre || "",
            descripcion: cancha.descripcion || "",
            tipo_cancha: cancha.tipo_cancha || "",
            ubicacion: cancha.ubicacion || "",
            precio_por_hora: cancha.precio_por_hora?.toString() || "",
            capacidad_jugadores: cancha.capacidad_jugadores?.toString() || "",
            horario_apertura: cancha.horario_apertura || "06:00",
            horario_cierre: cancha.horario_cierre || "22:00",
            disponible: cancha.disponible ?? true,
          });

          setCurrentImages(cancha.imagenes || []);
        } else {
          setMessage(data.message || "Error al cargar la cancha");
        }
      } else {
        setMessage("Error al obtener información de la cancha");
      }
    } catch (error) {
      console.error("Error al cargar cancha:", error);
      setMessage("Error de conexión al cargar la cancha");
    } finally {
      setLoadingCancha(false);
    }
  }, [canchaId]);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
      return;
    }

    if (user && user.rol !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (user && user.rol === "admin" && canchaId) {
      loadCancha();
    }
  }, [user, loading, router, canchaId, loadCancha]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) return "El nombre es requerido";
    if (!formData.descripcion.trim()) return "La descripción es requerida";
    if (!formData.tipo_cancha) return "El tipo de cancha es requerido";
    if (!formData.ubicacion.trim()) return "La ubicación es requerida";

    const precio = parseFloat(formData.precio_por_hora);
    if (isNaN(precio) || precio <= 0)
      return "El precio debe ser un número mayor a 0";

    const capacidad = parseInt(formData.capacidad_jugadores);
    if (isNaN(capacidad) || capacidad <= 0)
      return "La capacidad debe ser un número mayor a 0";

    if (!formData.horario_apertura)
      return "El horario de apertura es requerido";
    if (!formData.horario_cierre) return "El horario de cierre es requerido";

    if (formData.horario_apertura >= formData.horario_cierre) {
      return "El horario de cierre debe ser posterior al de apertura";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipo_cancha: formData.tipo_cancha,
        ubicacion: formData.ubicacion,
        precio_por_hora: parseFloat(formData.precio_por_hora),
        capacidad_jugadores: parseInt(formData.capacidad_jugadores),
        horario_apertura: formData.horario_apertura,
        horario_cierre: formData.horario_cierre,
        disponible: formData.disponible,
      };

      const response = await fetch(`/api/admin/canchas/${canchaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage("¡Cancha actualizada exitosamente!");

        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push("/admin/canchas");
        }, 2000);
      } else {
        setMessage(data.message || "Error al actualizar la cancha");
      }
    } catch (error) {
      console.error("Error al actualizar cancha:", error);
      setMessage("Error de conexión al actualizar la cancha");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCancha) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Cargando información de la cancha...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/canchas")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Edit className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Editar Cancha
              </h1>
              <p className="text-gray-700 font-medium">
                Modifica la información de la cancha
              </p>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                success
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center">
                {success ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">
              Información de la Cancha
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Modifica los campos que desees actualizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <Label htmlFor="nombre">Nombre de la cancha *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Cancha de Fútbol 5 - Centro Deportivo"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe las características de la cancha..."
                  rows={3}
                  required
                />
              </div>

              {/* Tipo de cancha y ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_cancha">Tipo de cancha *</Label>
                  <select
                    id="tipo_cancha"
                    name="tipo_cancha"
                    value={formData.tipo_cancha}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {tiposCancha.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="ubicacion">Ubicación *</Label>
                  <Input
                    id="ubicacion"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    placeholder="Ej: Av. Mariscal López 123, Asunción, Paraguay"
                    required
                  />
                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-blue-600 font-medium">
                      📍 Formatos aceptados:
                    </p>
                    <div className="text-gray-600 space-y-1">
                      <p>
                        •{" "}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          Dirección completa + ciudad + departamento
                        </span>
                      </p>
                      <p>
                        •{" "}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          Nombre del lugar + referencias
                        </span>
                      </p>
                      <p>
                        •{" "}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          Coordenadas GPS (Lat, Lng)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precio y capacidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio_por_hora">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Precio por hora (Gs.) *
                  </Label>
                  <Input
                    id="precio_por_hora"
                    name="precio_por_hora"
                    type="number"
                    value={formData.precio_por_hora}
                    onChange={handleInputChange}
                    placeholder="80000"
                    min="1"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="capacidad_jugadores">
                    <Users className="h-4 w-4 inline mr-1" />
                    Capacidad máxima *
                  </Label>
                  <Input
                    id="capacidad_jugadores"
                    name="capacidad_jugadores"
                    type="number"
                    value={formData.capacidad_jugadores}
                    onChange={handleInputChange}
                    placeholder="10"
                    min="1"
                    max="50"
                    required
                  />
                </div>
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horario_apertura">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Horario de apertura *
                  </Label>
                  <Input
                    id="horario_apertura"
                    name="horario_apertura"
                    type="time"
                    value={formData.horario_apertura}
                    onChange={handleInputChange}
                    required
                    className="cursor-pointer"
                    onFocus={(e) =>
                      e.target.showPicker && e.target.showPicker()
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="horario_cierre">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Horario de cierre *
                  </Label>
                  <Input
                    id="horario_cierre"
                    name="horario_cierre"
                    type="time"
                    value={formData.horario_cierre}
                    onChange={handleInputChange}
                    required
                    className="cursor-pointer"
                    onFocus={(e) =>
                      e.target.showPicker && e.target.showPicker()
                    }
                  />
                </div>
              </div>

              {/* Estado de la cancha */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="disponible"
                  name="disponible"
                  checked={formData.disponible}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <Label htmlFor="disponible" className="font-medium">
                  Cancha disponible para reservas
                </Label>
              </div>

              {/* Sección de imágenes */}
              <div>
                <Label className="text-base font-medium">Imágenes</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Sistema de carga de imágenes en desarrollo
                    </p>
                    <p className="text-sm text-gray-500">
                      Por ahora se usa una imagen por defecto
                    </p>
                    {currentImages.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Imágenes actuales:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {currentImages.map((img, index) => (
                            <div
                              key={index}
                              className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"
                            >
                              <span className="text-xs text-gray-500">
                                Img {index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/canchas")}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? "Actualizando..." : "Actualizar Cancha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
