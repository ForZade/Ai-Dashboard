import { Client } from "cassandra-driver";
import chalk from "chalk";

export const createMemoryMessagesTable = async (scylla: Client | null) => {
  if (!scylla) throw new Error("Scylla client is null");

  const query = `
    CREATE TABLE IF NOT EXISTS memory_messages (
      memory_id bigint,
      message_id bigint,
      memory_message_id bigint,
      vector_data text,
      importance_score float,
      created_at timestamp,
      PRIMARY KEY (memory_id, message_id)
    ) WITH CLUSTERING ORDER BY (message_id ASC);
  `;

  await scylla.execute(query);
  console.log(`[${chalk.cyan("ScyllaDB")}] Memory Messages table readyy`);
};
