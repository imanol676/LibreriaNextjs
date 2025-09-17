import { vi } from "vitest";

// Tipos para los mocks de Prisma
export type MockPrismaUser = {
  id: string;
  email: string;
  name?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  reviews?: MockPrismaReview[];
  favorites?: MockPrismaFavorite[];
};

export type MockPrismaBook = {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  reviews?: MockPrismaReview[];
  favorites?: MockPrismaFavorite[];
};

export type MockPrismaReview = {
  id: string;
  content: string;
  rating: number;
  bookId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  book?: MockPrismaBook;
  user?: MockPrismaUser;
  votes?: MockPrismaVote[];
};

export type MockPrismaFavorite = {
  id: string;
  userId: string;
  bookId: string;
  createdAt: Date;
  book?: MockPrismaBook;
  user?: MockPrismaUser;
};

export type MockPrismaVote = {
  id: string;
  reviewId: string;
  userId: string;
  type: "up" | "down";
  createdAt: Date;
  review?: MockPrismaReview;
  user?: MockPrismaUser;
};

// Base de datos en memoria para tests
class InMemoryDatabase {
  private users: Map<string, MockPrismaUser> = new Map();
  private books: Map<string, MockPrismaBook> = new Map();
  private reviews: Map<string, MockPrismaReview> = new Map();
  private favorites: Map<string, MockPrismaFavorite> = new Map();
  private votes: Map<string, MockPrismaVote> = new Map();

  // Métodos para gestionar la base de datos en memoria
  clear() {
    this.users.clear();
    this.books.clear();
    this.reviews.clear();
    this.favorites.clear();
    this.votes.clear();
  }

  // Usuarios
  addUser(user: MockPrismaUser) {
    this.users.set(user.id, user);
  }

  getUser(id: string): MockPrismaUser | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): MockPrismaUser | undefined {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  getAllUsers(): MockPrismaUser[] {
    return Array.from(this.users.values());
  }

  // Libros
  addBook(book: MockPrismaBook) {
    this.books.set(book.id, book);
  }

  getBook(id: string): MockPrismaBook | undefined {
    return this.books.get(id);
  }

  getAllBooks(): MockPrismaBook[] {
    return Array.from(this.books.values());
  }

  // Reseñas
  addReview(review: MockPrismaReview) {
    this.reviews.set(review.id, review);
  }

  getReview(id: string): MockPrismaReview | undefined {
    return this.reviews.get(id);
  }

  getReviewsByBook(bookId: string): MockPrismaReview[] {
    return Array.from(this.reviews.values()).filter(
      (review) => review.bookId === bookId
    );
  }

  getReviewsByUser(userId: string): MockPrismaReview[] {
    return Array.from(this.reviews.values()).filter(
      (review) => review.userId === userId
    );
  }

  // Favoritos
  addFavorite(favorite: MockPrismaFavorite) {
    this.favorites.set(favorite.id, favorite);
  }

  getFavorite(userId: string, bookId: string): MockPrismaFavorite | undefined {
    return Array.from(this.favorites.values()).find(
      (fav) => fav.userId === userId && fav.bookId === bookId
    );
  }

  getFavoritesByUser(userId: string): MockPrismaFavorite[] {
    return Array.from(this.favorites.values()).filter(
      (fav) => fav.userId === userId
    );
  }

  removeFavorite(userId: string, bookId: string): boolean {
    const favorite = this.getFavorite(userId, bookId);
    if (favorite) {
      this.favorites.delete(favorite.id);
      return true;
    }
    return false;
  }

  // Votos
  addVote(vote: MockPrismaVote) {
    this.votes.set(vote.id, vote);
  }

  getVote(reviewId: string, userId: string): MockPrismaVote | undefined {
    return Array.from(this.votes.values()).find(
      (vote) => vote.reviewId === reviewId && vote.userId === userId
    );
  }

  getVotesByReview(reviewId: string): MockPrismaVote[] {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.reviewId === reviewId
    );
  }
}

// Instancia global de la base de datos en memoria
export const mockDatabase = new InMemoryDatabase();

// Factory functions para crear datos de prueba
export const createMockUser = (
  overrides: Partial<MockPrismaUser> = {}
): MockPrismaUser => ({
  id: `user-${Date.now()}-${Math.random()}`,
  email: `test-${Date.now()}@example.com`,
  name: "Test User",
  password: "hashedPassword123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBook = (
  overrides: Partial<MockPrismaBook> = {}
): MockPrismaBook => ({
  id: `book-${Date.now()}-${Math.random()}`,
  title: "Test Book",
  authors: ["Test Author"],
  description: "A test book description",
  publishedDate: "2023-01-01",
  pageCount: 300,
  categories: ["Fiction"],
  imageLinks: {
    thumbnail: "http://example.com/image.jpg",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockReview = (
  overrides: Partial<MockPrismaReview> = {}
): MockPrismaReview => ({
  id: `review-${Date.now()}-${Math.random()}`,
  content: "This is a great book review!",
  rating: 5,
  bookId: "book-123",
  userId: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockFavorite = (
  overrides: Partial<MockPrismaFavorite> = {}
): MockPrismaFavorite => ({
  id: `favorite-${Date.now()}-${Math.random()}`,
  userId: "user-123",
  bookId: "book-123",
  createdAt: new Date(),
  ...overrides,
});

export const createMockVote = (
  overrides: Partial<MockPrismaVote> = {}
): MockPrismaVote => ({
  id: `vote-${Date.now()}-${Math.random()}`,
  reviewId: "review-123",
  userId: "user-123",
  type: "up",
  createdAt: new Date(),
  ...overrides,
});

// Mock completo de Prisma Client
export const createMockPrismaClient = () => {
  return {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.id) {
          return Promise.resolve(mockDatabase.getUser(where.id));
        }
        if (where.email) {
          return Promise.resolve(mockDatabase.getUserByEmail(where.email));
        }
        return Promise.resolve(null);
      }),

      findMany: vi.fn().mockImplementation(() => {
        return Promise.resolve(mockDatabase.getAllUsers());
      }),

      create: vi.fn().mockImplementation(({ data }: any) => {
        const user = createMockUser(data);
        mockDatabase.addUser(user);
        return Promise.resolve(user);
      }),

      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const user = mockDatabase.getUser(where.id);
        if (user) {
          const updatedUser = { ...user, ...data, updatedAt: new Date() };
          mockDatabase.addUser(updatedUser);
          return Promise.resolve(updatedUser);
        }
        throw new Error("User not found");
      }),

      delete: vi.fn().mockImplementation(({ where }: any) => {
        const user = mockDatabase.getUser(where.id);
        if (user) {
          mockDatabase.clear(); // Simplified - en real sería más específico
          return Promise.resolve(user);
        }
        throw new Error("User not found");
      }),
    },

    book: {
      findUnique: vi.fn().mockImplementation(({ where, include }: any) => {
        const book = mockDatabase.getBook(where.id);
        if (book && include?.reviews) {
          return Promise.resolve({
            ...book,
            reviews: mockDatabase.getReviewsByBook(book.id),
          });
        }
        return Promise.resolve(book);
      }),

      findMany: vi.fn().mockImplementation(({ include }: any) => {
        const books = mockDatabase.getAllBooks();
        if (include?.reviews) {
          return Promise.resolve(
            books.map((book) => ({
              ...book,
              reviews: mockDatabase.getReviewsByBook(book.id),
            }))
          );
        }
        return Promise.resolve(books);
      }),

      create: vi.fn().mockImplementation(({ data }: any) => {
        const book = createMockBook(data);
        mockDatabase.addBook(book);
        return Promise.resolve(book);
      }),

      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const book = mockDatabase.getBook(where.id);
        if (book) {
          const updatedBook = { ...book, ...data, updatedAt: new Date() };
          mockDatabase.addBook(updatedBook);
          return Promise.resolve(updatedBook);
        }
        throw new Error("Book not found");
      }),
    },

    review: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(mockDatabase.getReview(where.id));
      }),

      findMany: vi.fn().mockImplementation(({ where, include }: any) => {
        let reviews: MockPrismaReview[] = [];

        if (where?.bookId) {
          reviews = mockDatabase.getReviewsByBook(where.bookId);
        } else if (where?.userId) {
          reviews = mockDatabase.getReviewsByUser(where.userId);
        } else {
          reviews = Array.from(mockDatabase["reviews"].values());
        }

        if (include?.user) {
          return Promise.resolve(
            reviews.map((review) => ({
              ...review,
              user: mockDatabase.getUser(review.userId),
            }))
          );
        }

        return Promise.resolve(reviews);
      }),

      create: vi.fn().mockImplementation(({ data }: any) => {
        const review = createMockReview(data);
        mockDatabase.addReview(review);
        return Promise.resolve(review);
      }),

      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const review = mockDatabase.getReview(where.id);
        if (review) {
          const updatedReview = { ...review, ...data, updatedAt: new Date() };
          mockDatabase.addReview(updatedReview);
          return Promise.resolve(updatedReview);
        }
        throw new Error("Review not found");
      }),

      delete: vi.fn().mockImplementation(({ where }: any) => {
        const review = mockDatabase.getReview(where.id);
        if (review) {
          // En implementación real, se eliminaría del Map
          return Promise.resolve(review);
        }
        throw new Error("Review not found");
      }),
    },

    favorite: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.userId_bookId) {
          return Promise.resolve(
            mockDatabase.getFavorite(
              where.userId_bookId.userId,
              where.userId_bookId.bookId
            )
          );
        }
        return Promise.resolve(null);
      }),

      findMany: vi.fn().mockImplementation(({ where, include }: any) => {
        const favorites = mockDatabase.getFavoritesByUser(where.userId);

        if (include?.book) {
          return Promise.resolve(
            favorites.map((fav) => ({
              ...fav,
              book: mockDatabase.getBook(fav.bookId),
            }))
          );
        }

        return Promise.resolve(favorites);
      }),

      create: vi.fn().mockImplementation(({ data, include }: any) => {
        const favorite = createMockFavorite(data);
        mockDatabase.addFavorite(favorite);

        if (include?.book) {
          return Promise.resolve({
            ...favorite,
            book: mockDatabase.getBook(favorite.bookId),
          });
        }

        return Promise.resolve(favorite);
      }),

      delete: vi.fn().mockImplementation(({ where }: any) => {
        if (where.userId_bookId) {
          const removed = mockDatabase.removeFavorite(
            where.userId_bookId.userId,
            where.userId_bookId.bookId
          );
          if (removed) {
            return Promise.resolve({});
          }
        }
        throw new Error("Favorite not found");
      }),
    },

    vote: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.reviewId_userId) {
          return Promise.resolve(
            mockDatabase.getVote(
              where.reviewId_userId.reviewId,
              where.reviewId_userId.userId
            )
          );
        }
        return Promise.resolve(null);
      }),

      findMany: vi.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(mockDatabase.getVotesByReview(where.reviewId));
      }),

      create: vi.fn().mockImplementation(({ data }: any) => {
        const vote = createMockVote(data);
        mockDatabase.addVote(vote);
        return Promise.resolve(vote);
      }),

      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const vote = mockDatabase.getVote(
          where.reviewId_userId.reviewId,
          where.reviewId_userId.userId
        );
        if (vote) {
          const updatedVote = { ...vote, ...data };
          mockDatabase.addVote(updatedVote);
          return Promise.resolve(updatedVote);
        }
        throw new Error("Vote not found");
      }),

      delete: vi.fn().mockImplementation(({ where }: any) => {
        // Implementación simplificada
        return Promise.resolve({});
      }),
    },
  };
};

// Utility functions para setup de tests
export const setupMockDatabase = () => {
  mockDatabase.clear();
};

export const seedMockDatabase = () => {
  const user = createMockUser({ id: "user-123", email: "test@example.com" });
  const book = createMockBook({ id: "book-123", title: "Test Book" });
  const review = createMockReview({
    id: "review-123",
    userId: user.id,
    bookId: book.id,
  });

  mockDatabase.addUser(user);
  mockDatabase.addBook(book);
  mockDatabase.addReview(review);

  return { user, book, review };
};
