"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites } from "@/contexts/FavoritesContext";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface FavoritesListProps {
  user: User;
}

export default function FavoritesList({ user: _user }: FavoritesListProps) {
  const { favorites, loading, removeFromFavorites, refreshFavorites } =
    useFavorites();
  const [error, setError] = useState("");

  const handleRemoveFavorite = async (bookId: string) => {
    try {
      const success = await removeFromFavorites(bookId);
      if (!success) {
        setError("Error al eliminar favorito");
      }
    } catch (error) {
      setError("Error de conexión");
      console.error("Error removing favorite:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white">Cargando favoritos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">❌ {error}</div>
          <button
            onClick={refreshFavorites}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No tienes favoritos aún
          </h3>
          <p className="text-gray-400 mb-6">
            Explora libros y agrégalos a tus favoritos para verlos aquí
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-300 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            🔍 Buscar Libros
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          ❤️ Mis Favoritos ({favorites.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex flex-col h-full">
              {favorite.book.thumbnailUrl && (
                <div className="mb-4 flex justify-center">
                  <Image
                    src={favorite.book.thumbnailUrl}
                    alt={favorite.book.title}
                    width={96}
                    height={144}
                    className="w-24 h-36 object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {favorite.book.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {favorite.book.authors || "Autor desconocido"}
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Agregado el{" "}
                  {new Date(favorite.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/book/${favorite.bookId}`}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-center py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  📖 Ver Libro
                </Link>
                <button
                  onClick={() => handleRemoveFavorite(favorite.bookId)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                  title="Eliminar de favoritos"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
