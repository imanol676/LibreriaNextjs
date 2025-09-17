"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import FavoritesList from "@/components/profile/FavoritesList";
import ReviewsHistory from "@/components/profile/ReviewsHistory";

interface User {
  id: string;
  name: string;
  email?: string;
}

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"auth" | "favorites" | "reviews">(
    "auth"
  );
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (user) {
      setActiveTab("favorites");
    } else {
      setActiveTab("auth");
    }
  }, [user]);

  const handleAuthSuccess = (userData: User) => {
    setActiveTab("favorites");
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab("auth");
    setAuthMode("login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-white">Cargando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-700 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {user ? `¡Hola, ${user.name}!` : "Mi Perfil"}
          </h1>
          <p className="text-xl text-gray-300">
            {user
              ? "Gestiona tus favoritos y reseñas"
              : "Accede o regístrate para guardar tus libros favoritos"}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            <nav className="flex space-x-2">
              {!user ? (
                <>
                  <button
                    onClick={() => {
                      setActiveTab("auth");
                      setAuthMode("login");
                    }}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === "auth" && authMode === "login"
                        ? "bg-violet-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    🔐 Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("auth");
                      setAuthMode("register");
                    }}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === "auth" && authMode === "register"
                        ? "bg-violet-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    📝 Registrarse
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab("favorites")}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === "favorites"
                        ? "bg-violet-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    ❤️ Favoritos
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === "reviews"
                        ? "bg-violet-600 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    📝 Mis Reseñas
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "auth" && !user && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              {authMode === "login" ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onToggleMode={() => setAuthMode("register")}
                />
              ) : (
                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onToggleMode={() => setAuthMode("login")}
                />
              )}
            </div>
          )}

          {activeTab === "favorites" && user && <FavoritesList user={user} />}

          {activeTab === "reviews" && user && <ReviewsHistory user={user} />}
        </div>

        {/* Logout Section */}
        {user && (
          <div className="text-center mt-12">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
