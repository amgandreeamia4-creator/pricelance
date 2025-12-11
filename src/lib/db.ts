// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// We rely on DATABASE_URL for the connection, but we don't hard-fail here in dev
// because Next may evaluate this module in different contexts.
const dbUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV !== "production") {
  // This helps confirm what Next sees at runtime
  console.log("[db] DATABASE_URL at runtime:", dbUrl ?? "(undefined)");
}

// Reuse the PrismaClient across hot reloads in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // If dbUrl is defined, we pass it explicitly; otherwise Prisma falls back to its default
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;