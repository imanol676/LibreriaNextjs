"use client";
import { useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  authors: string[];
  thumbnail?: string | null;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, Setloading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    Setloading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    console.log(json);
    setItems(json.results ?? []);
    Setloading(false);
  }
  //probando workflows comentando
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-purple-900 to-slate-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              ElPapu
              <span className="bg-gradient-to-r from-violet-400 to-violet-400 bg-clip-text text-transparent">
                Lector
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Descubre tu próxima lectura favorita en nuestra biblioteca digital
            </p>

            {/* Search Form */}
            <form onSubmit={onSearch} className="max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="¿Qué libro estás buscando?"
                  className="flex-1 bg-transparent text-white placeholder-gray-300 px-6 py-4 rounded-xl focus:outline-none text-lg"
                />
                <button
                  type="submit"
                  className="ml-2  bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-300 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🔍 Buscar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Buscando libros increíbles...
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Resultados de tu búsqueda
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((book) => (
                <div
                  key={book.id}
                  className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="flex flex-col h-full">
                    {book.thumbnail && (
                      <div className="mb-4 flex justify-center">
                        <img
                          src={book.thumbnail}
                          alt={book.title}
                          className="w-32 h-48 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-gray-400 mb-4 text-sm">
                        {(book.authors || []).join(", ") || "Autor desconocido"}
                      </p>
                    </div>
                    <Link
                      className="inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-violet-300 hover:from-violet-700 hover:to-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                      href={`/book/${book.id}`}
                    >
                      📖 Ver detalles
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && items.length === 0 && query && (
          <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron libros
              </h3>
              <p className="text-gray-400">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          </div>
        )}

        {!query && items.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                ¡Bienvenido a ElPapuLector!
              </h3>
              <p className="text-gray-300 text-lg">
                Comienza tu búsqueda escribiendo el nombre de un libro, autor o
                tema que te interese
              </p>
            </div>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/10">
        <h4 className="text-5xl md:text-7xl font-bold text-white mb-6">
          ElPapu
          <span className="bg-gradient-to-r from-violet-400 to-violet-400 bg-clip-text text-transparent">
            Lector
          </span>
        </h4>

        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} ElPapuLector. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  );
}
