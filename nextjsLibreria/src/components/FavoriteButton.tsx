"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";

interface FavoriteButtonProps {
  bookId: string;
  title: string;
  authors: string;
  thumbnail?: string;
  className?: string;
}

export default function FavoriteButton({
  bookId,
  title,
  authors,
  thumbnail,
  className = "",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const [loading, setLoading] = useState(false);

  const isCurrentlyFavorite = isFavorite(bookId);

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert("Debes iniciar sesión para agregar favoritos");
      return;
    }

    setLoading(true);
    try {
      if (isCurrentlyFavorite) {
        const success = await removeFromFavorites(bookId);
        if (!success) {
          alert("Error al quitar de favoritos");
        }
      } else {
        const success = await addToFavorites(bookId, {
          title,
          authors,
          thumbnail,
        });
        if (!success) {
          alert("Error al agregar a favoritos");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // No mostrar el botón si no hay usuario autenticado
  }

  return (
    <button
      onClick={handleFavoriteToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
        isCurrentlyFavorite
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
      } ${
        loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
      } ${className}`}
    >
      <span className="text-lg">
        {loading ? "⏳" : isCurrentlyFavorite ? "❤️" : "🤍"}
      </span>
      <span>
        {loading
          ? "Procesando..."
          : isCurrentlyFavorite
          ? "Quitar de favoritos"
          : "Agregar a favoritos"}
      </span>
    </button>
  );
}
