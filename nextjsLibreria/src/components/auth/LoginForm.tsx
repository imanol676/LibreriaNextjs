"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface LoginFormProps {
  onSuccess: (user: User) => void;
  onToggleMode: () => void;
}

export default function LoginForm({ onSuccess, onToggleMode }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        onSuccess({ id: "", name: "", email });
      } else {
        setError("Credenciales inválidas");
      }
    } catch (error) {
      setError("Error de conexión. Inténtalo de nuevo.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-6">
        Iniciar Sesión
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="tu@email.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-300 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Iniciando sesión...</span>
            </div>
          ) : (
            "🔐 Iniciar Sesión"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          ¿No tienes una cuenta?{" "}
          <button
            onClick={onToggleMode}
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors duration-200"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
