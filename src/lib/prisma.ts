import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // Prisma construction is intentionally build-safe. Request guards require a
  // real DATABASE_URL before accessing protected data; this fallback never
  // reaches a database unless an unconfigured deployment receives a request.
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/tekmonk" });
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
