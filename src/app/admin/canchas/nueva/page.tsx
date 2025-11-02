"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  MapPin,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
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
}

export default function NuevaCanchaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    descripcion: "",
    tipo_cancha: "",
    ubicacion: "",
    precio_por_hora: "",
    capacidad_jugadores: "",
    horario_apertura: "06:00",
    horario_cierre: "22:00",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Verificar permisos
  useEffect(() => {
    if (!loading && (!user || user.rol !== "admin")) {
      router.push("/");
      return;
    }
  }, [user, loading, router]);

  const tiposCancha = [
    { value: "Football11", label: "Fútbol 11" },
    { value: "Football5", label: "Fútbol 5" },
    { value: "Tennis", label: "Tenis" },
    { value: "Basketball", label: "Básquet" },
    { value: "Padel", label: "Pádel" },
    { value: "Volleyball", label: "Vóley" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        ...formData,
        precio_por_hora: parseFloat(formData.precio_por_hora),
        capacidad_jugadores: parseInt(formData.capacidad_jugadores),
        disponible: true,
        imagenes: ["/api/placeholder/600/400"], // Imagen por defecto
      };

      const response = await fetch("/api/admin/canchas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage("¡Cancha creada exitosamente!");

        // Limpiar formulario
        setFormData({
          nombre: "",
          descripcion: "",
          tipo_cancha: "",
          ubicacion: "",
          precio_por_hora: "",
          capacidad_jugadores: "",
          horario_apertura: "06:00",
          horario_cierre: "22:00",
        });

        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push("/admin/canchas");
        }, 2000);
      } else {
        setMessage(data.message || "Error al crear la cancha");
      }
    } catch (error) {
      console.error("Error al crear cancha:", error);
      setMessage("Error de conexión al crear la cancha");
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
            <MapPin className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Agregar Nueva Cancha
              </h1>
              <p className="text-gray-700 font-medium">
                Registra una nueva cancha en el sistema
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
              Completa todos los campos para registrar la nueva cancha
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
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
                      <p className="font-medium">💡 Ejemplos:</p>
                      <p>
                        • &quot;Estadio Municipal, Loma Plata, Boquerón&quot;
                      </p>
                      <p>
                        • &quot;Av. Central 456, Ciudad del Este, Alto
                        Paraná&quot;
                      </p>
                      <p>• &quot;Lat: -25.2637, Lng: -57.5759&quot;</p>
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
                    className="cursor-pointer"
                    onFocus={(e) =>
                      e.target.showPicker && e.target.showPicker()
                    }
                    required
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
                    className="cursor-pointer"
                    onFocus={(e) =>
                      e.target.showPicker && e.target.showPicker()
                    }
                    required
                  />
                </div>
              </div>

              {/* Sección de imágenes */}
              <div>
                <Label className="text-base font-medium">
                  Imágenes de la cancha
                </Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Sistema de carga de imágenes en desarrollo
                    </p>
                    <p className="text-sm text-gray-500">
                      Por ahora se asignará una imagen por defecto
                    </p>
                    <div className="mt-4 text-xs text-blue-600">
                      💡 Próximamente: Arrastra archivos aquí o haz clic para
                      subir
                    </div>
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
                  {submitting ? "Creando..." : "Crear Cancha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
