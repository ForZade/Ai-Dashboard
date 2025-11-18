import { Snowflake } from "@sapphire/snowflake";

const EPOCH = new Date("2025-01-01T00:00:00.000Z");

export const snowflake = new Snowflake(EPOCH);

export function generateId(): bigint {
  return snowflake.generate();
}