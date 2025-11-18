import { Client } from "cassandra-driver";
import chalk from "chalk";
import { createMessagesTable } from './tables/messages.table';
import { createMemoryMessagesTable } from './tables/memory.table';

export class ScyllaService {
  private scylla: Client | null = null;

  async connect() {
    if (this.scylla) return this.scylla;

    this.scylla = new Client({
      contactPoints: [process.env.SCYLLA_HOST || "127.0.0.1"],
      localDataCenter: process.env.SCYLLA_DATACENTER || "datacenter1",
      keyspace: process.env.SCYLLA_KEYSPACE || "ai_dashboard",
    });

    try {
      await this.scylla.connect();
      console.log(`[${chalk.cyan("ScyllaDB")}] connected successfully`);

      await this.initTables();
    } catch(err: unknown) {
      console.error(`[${chalk.red("ScyllaDB")}] connection failed`);
      throw err
    }
  }

  private async initTables() {
    try {
      await createMessagesTable(this.scylla);
      await createMemoryMessagesTable(this.scylla);

      console.log(`[${chalk.cyan("ScyllaDB")}] Tables deployed successfully`);
    } catch (err: unknown) {
      console.error(`[${chalk.red("ScyllaDB")}] Failed to deploy tables`);
    }
  }

  getClient() {
    if (!this.scylla) {
      throw new Error("Posgres DB is not connected");
    }

    return this.scylla;
  }
}