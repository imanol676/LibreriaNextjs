"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">
              ElPapu
              <span className="bg-gradient-to-r from-violet-400 to-violet-400 bg-clip-text text-transparent">
                Lector
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              🏠 Inicio
            </Link>

            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  👤 Mi Perfil
                </Link>
                <span className="text-gray-400 text-sm">Hola, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link
                href="/profile"
                className="bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-300 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                🔐 Acceder
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Inicio
              </Link>

              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-gray-400">Cargando...</span>
                </div>
              ) : user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 Mi Perfil
                  </Link>
                  <span className="text-gray-400 text-sm">
                    Hola, {user.name}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-left"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/profile"
                  className="bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-300 text-white px-6 py-2 rounded-lg transition-all duration-200 inline-block text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🔐 Acceder
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
