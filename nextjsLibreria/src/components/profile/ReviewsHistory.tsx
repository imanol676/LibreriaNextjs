"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface Book {
  id: string;
  title: string;
  authors: string;
  thumbnailUrl?: string;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  bookId: string;
  book: Book;
}

interface ReviewsHistoryProps {
  user: User;
}

export default function ReviewsHistory({ user: _user }: ReviewsHistoryProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reviews/user");

      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        setError("Error al cargar reseñas");
      }
    } catch (error) {
      setError("Error de conexión");
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta reseña?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReviews(reviews.filter((review) => review.id !== reviewId));
      } else {
        setError("Error al eliminar reseña");
      }
    } catch (error) {
      setError("Error de conexión");
      console.error("Error deleting review:", error);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReview(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const cancelEditing = () => {
    setEditingReview(null);
    setEditContent("");
    setEditRating(5);
  };

  const saveEdit = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editContent,
          rating: editRating,
        }),
      });

      if (response.ok) {
        await response.json(); // Response procesado pero no usado
        setReviews(
          reviews.map((review) =>
            review.id === reviewId
              ? { ...review, content: editContent, rating: editRating }
              : review
          )
        );
        cancelEditing();
      } else {
        setError("Error al actualizar reseña");
      }
    } catch (error) {
      setError("Error de conexión");
      console.error("Error updating review:", error);
    }
  };

  const renderStars = (
    rating: number,
    isEditable = false,
    onRatingChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isEditable}
            onClick={() => isEditable && onRatingChange?.(star)}
            className={`text-xl ${
              star <= rating ? "text-yellow-400" : "text-gray-400"
            } ${
              isEditable
                ? "hover:text-yellow-300 cursor-pointer"
                : "cursor-default"
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white">Cargando reseñas...</span>
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
            onClick={loadReviews}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No has escrito reseñas aún
          </h3>
          <p className="text-gray-400 mb-6">
            Comparte tu opinión sobre los libros que has leído
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
          📝 Mis Reseñas ({reviews.length})
        </h2>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Book Info */}
              <div className="flex-shrink-0">
                {review.book.thumbnailUrl && (
                  <Image
                    src={review.book.thumbnailUrl}
                    alt={review.book.title}
                    width={80}
                    height={112}
                    className="w-20 h-28 object-cover rounded-lg shadow-lg mx-auto md:mx-0"
                  />
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {review.book.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {review.book.authors || "Autor desconocido"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <span className="text-gray-400 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  {editingReview === review.id ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Calificación:
                      </label>
                      {renderStars(editRating, true, setEditRating)}
                    </div>
                  ) : (
                    renderStars(review.rating)
                  )}
                </div>

                {/* Content */}
                {editingReview === review.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Reseña:
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        rows={4}
                        maxLength={5000}
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveEdit(review.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        💾 Guardar
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 mb-4 leading-relaxed">
                      {review.content}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/book/${review.book.id}`}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                      >
                        📖 Ver Libro
                      </Link>
                      <button
                        onClick={() => startEditing(review)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
