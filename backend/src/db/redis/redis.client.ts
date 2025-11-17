import Redis from "ioredis";
import chalk from "chalk";

export const redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
});

export const redis = {
    getClient: () => redisClient,
};

export class RedisService {
    private redis: Redis | null = null;

    async connect() {
        if (this.redis) return this.redis;

        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
        });

        this.redis.on("connect", () => console.log(`[${chalk.redBright("Redis")}] connected successfully`));
        this.redis.on("error", (err: unknown) => console.error(`[${chalk.red("Redis")}] error:\n${chalk.red("・")}${err}`));

        await this.redis.ping();
    }

    getClient() {
        if (!this.redis) {
            throw new Error("Redis has not been initialized. Call connect() first.");
        }
        
        return this.redis;
    }
}