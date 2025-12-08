// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// DATABASE_URL = "file:./prisma/dev.db" (relative to project root).
// DB file lives at <project-root>/prisma/dev.db.
const defaultDevUrl = "file:./prisma/dev.db";
const dbUrl = process.env.DATABASE_URL || defaultDevUrl;

if (process.env.NODE_ENV !== "production") {
  const masked = (dbUrl || "sqlite:./prisma/dev.db").replace(
    /:.+@/,
    "://****:****@"
  );
  console.log("[db] Using database URL", masked);
}

// Reuse the PrismaClient across hot reloads in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;