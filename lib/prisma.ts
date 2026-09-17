// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  poolErrorBound: boolean | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!globalForPrisma.pool || !globalForPrisma.prisma) {
  globalForPrisma.pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    keepAlive: true,
  });
  globalForPrisma.prisma = new PrismaClient({
    adapter: new PrismaPg(globalForPrisma.pool),
  });
}

const pool = globalForPrisma.pool;
export const prisma = globalForPrisma.prisma;

if (!globalForPrisma.poolErrorBound) {
  globalForPrisma.poolErrorBound = true;
  pool.on('error', () => {
    // Prevent unhandled idle-client errors from crashing the process.
  });
}
