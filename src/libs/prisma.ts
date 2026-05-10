import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const buildDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "3306";
  const user = encodeURIComponent(process.env.DB_USER ?? "root");
  const password = encodeURIComponent(process.env.DB_PASSWORD ?? "password");
  const database = process.env.DB_NAME ?? "umc_10th";

  return `mysql://${user}:${password}@${host}:${port}/${database}`;
};

const adapter = new PrismaMariaDb(buildDatabaseUrl());

export const prisma = new PrismaClient({
  adapter,
  log: [{ emit: "event", level: "query" }],
});

prisma.$on("query", (event) => {
  console.log(`[Prisma Query] ${event.duration}ms ${event.query}`);
});
