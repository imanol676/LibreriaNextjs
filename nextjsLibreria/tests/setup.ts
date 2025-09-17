import { beforeEach, afterEach, beforeAll, afterAll, vi } from "vitest";
import { setupMockDatabase, mockDatabase } from "./mocks/database";

// Configuración global para todos los tests
beforeAll(() => {
  // Configurar variables de entorno para testing
  vi.stubEnv("JWT_SECRET", "test-secret-key-for-testing-only");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("MONGODB_URL", "mongodb://localhost:27017/test");

  // Configurar timezone para tests consistentes
  process.env.TZ = "UTC";
});

afterAll(() => {
  // Limpiar variables de entorno
  vi.unstubAllEnvs();
});

beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  vi.clearAllMocks();

  // Restablecer la base de datos en memoria
  setupMockDatabase();

  // Mock global de console para evitar spam en tests
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Restaurar console
  vi.restoreAllMocks();

  // Limpiar la base de datos en memoria
  mockDatabase.clear();
});
