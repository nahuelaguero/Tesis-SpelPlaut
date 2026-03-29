"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Upload, X } from "lucide-react";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

  const handleImageSelect = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const uploadFiles = async (incomingFiles: FileList | File[]) => {
    const selectedFiles = Array.from(incomingFiles).slice(
      0,
      Math.max(maxImages - images.length, 0)
    );

    if (!selectedFiles.length) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudieron subir las imagenes.");
      }

      const uploadedUrls = (data.data?.files || []).map(
        (file: { url: string }) => file.url
      );
      const updatedImages = [...images, ...uploadedUrls].slice(0, maxImages);

      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudieron subir las imagenes."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void uploadFiles(event.target.files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (event.dataTransfer.files) {
      void uploadFiles(event.dataTransfer.files);
    }
  };

  const removeImage = async (index: number) => {
    const imageToDelete = images[index];
    const updatedImages = images.filter((_, currentIndex) => currentIndex !== index);

    setImages(updatedImages);
    onImagesChange?.(updatedImages);

    if (!imageToDelete.startsWith("http")) {
      return;
    }

    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ url: imageToDelete }),
      });
    } catch (deleteError) {
      console.error("Error eliminando imagen:", deleteError);
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
          } ${uploading ? "opacity-70 pointer-events-none" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleImageSelect}
        >
          <div className="space-y-2">
            <div className="flex justify-center">
              {uploading ? (
                <Upload className="h-8 w-8 text-emerald-500 animate-pulse" />
              ) : isDragOver ? (
                <Upload className="h-8 w-8 text-emerald-500" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-gray-600 font-medium">
                {uploading
                  ? "Subiendo imagenes..."
                  : isDragOver
                  ? "Suelta las imágenes aquí"
                  : "Agregar imágenes"}
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

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="relative group">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={`Imagen de cancha ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void removeImage(index)}
                className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>

              {index === 0 && (
                <div className="absolute bottom-2 left-2 rounded bg-emerald-500 px-2 py-1 text-xs text-white">
                  Principal
                </div>
              )}
            </div>
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={handleImageSelect}
              disabled={uploading}
              className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            >
              <div className="text-center">
                <Upload className="mx-auto mb-1 h-6 w-6 text-gray-400" />
                <p className="text-sm text-gray-500">Agregar más</p>
              </div>
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
