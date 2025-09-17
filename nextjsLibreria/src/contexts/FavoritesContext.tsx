"use client";
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
  book: {
    id: string;
    title: string;
    authors: string;
    thumbnailUrl?: string;
  };
}

interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (bookId: string) => boolean;
  addToFavorites: (
    bookId: string,
    bookData: { title: string; authors: string; thumbnail?: string }
  ) => Promise<boolean>;
  removeFromFavorites: (bookId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshFavorites();
  }, [user, refreshFavorites]);

  const isFavorite = (bookId: string): boolean => {
    return favorites.some((fav) => fav.bookId === bookId);
  };

  const addToFavorites = async (
    bookId: string,
    bookData: { title: string; authors: string; thumbnail?: string }
  ): Promise<boolean> => {
    try {
      // Primero crear/verificar el libro
      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookId,
          title: bookData.title,
          authors: bookData.authors,
          thumbnailUrl: bookData.thumbnail,
        }),
      });

      // Luego agregar a favoritos
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok || response.status === 409) {
        await refreshFavorites();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding to favorites:", error);
      return false;
    }
  };

  const removeFromFavorites = async (bookId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (response.ok) {
        await refreshFavorites();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      return false;
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        addToFavorites,
        removeFromFavorites,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
