"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
  currentImages?: string[];
}

export function ImageUploader({
  onImagesChange,
  maxImages = 5,
  currentImages = [],
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Simular procesamiento de archivos
    const newImageUrls = Array.from(files).map(
      (file, index) =>
        `/api/placeholder/300/200?img=${
          images.length + index + 1
        }&name=${encodeURIComponent(file.name)}`
    );

    const updatedImages = [...images, ...newImageUrls].slice(0, maxImages);
    setImages(updatedImages);

    if (onImagesChange) {
      onImagesChange(updatedImages);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    // Simular procesamiento de archivos drag & drop
    const newImageUrls = Array.from(files).map(
      (file, index) =>
        `/api/placeholder/300/200?img=${
          images.length + index + 1
        }&name=${encodeURIComponent(file.name)}`
    );

    const updatedImages = [...images, ...newImageUrls].slice(0, maxImages);
    setImages(updatedImages);

    if (onImagesChange) {
      onImagesChange(updatedImages);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);

    if (onImagesChange) {
      onImagesChange(updatedImages);
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Zona de drop */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleImageSelect}
        >
          <div className="space-y-2">
            <div className="flex justify-center">
              {isDragOver ? (
                <Upload className="h-8 w-8 text-emerald-500" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-gray-600 font-medium">
                {isDragOver ? "Suelta las imágenes aquí" : "Agregar imágenes"}
              </p>
              <p className="text-sm text-gray-500">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP hasta 5MB ({images.length}/{maxImages})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                {/* Simular imagen */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              {/* Botón de eliminar */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Indicador de imagen principal */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}

          {/* Botón para agregar más */}
          {canAddMore && (
            <button
              type="button"
              onClick={handleImageSelect}
              className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
            >
              <div className="text-center">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">Agregar más</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Estado del sistema */}
      <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
        ⚙️ <strong>Sistema en desarrollo:</strong> Las imágenes se simularán
        hasta implementar el sistema de almacenamiento real (ej: Cloudinary, AWS
        S3)
      </div>
    </div>
  );
}
