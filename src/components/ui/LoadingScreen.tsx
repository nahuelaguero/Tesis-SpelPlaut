"use client";

import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">SP</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SpelPlaut</h1>
        <p className="text-gray-600 mb-6">Cargando...</p>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
      </div>
    </div>
  );
}
