import dotenv from "dotenv";
import chalk from "chalk";
import { createServer } from "./plugins";

dotenv.config();

const port = Number(process.env.PORT) || 7000;
const host = process.env.HOST || "0.0.0.0";

export async function startServer() {
  const app = createServer();

  try {
    await app.listen({ port, host });
    console.log(`[${chalk.green("Fastify")}] Server running at http://localhost:${port}`);
  } catch (err) {
    console.error(`[${chalk.red("Fastify")}] Failed to start server\n${chalk.red("・")}${err}`);
    process.exit(1);
  }
}

startServer();
