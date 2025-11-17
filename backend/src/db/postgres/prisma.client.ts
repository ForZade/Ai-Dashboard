import { PrismaClient } from "./prisma";
import chalk from "chalk";

export class PrismaService {
  private prisma: PrismaClient | null = null;

  async connect() {
    if (this.prisma) return this.prisma;

    try {
        this.prisma = new PrismaClient({
            log: process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
        });

        await this.prisma.$connect();
        console.log(`[${chalk.cyan("PostgreSQL")}] connected successfully`);
    } catch (err: unknown) {
        console.error(`[${chalk.red("PostgreSQL")}] connection failed`);
        throw err;
    }
  }

  async getClient() {
    if (!this.prisma) {
      throw new Error("Posgres DB is not connected");
    }

    return this.prisma;
  }
}