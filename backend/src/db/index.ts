import { PrismaService } from "./postgres/prisma.client";
import { RedisService } from "./redis/redis.client";
import { ScyllaService } from "./scylla/scylla.client";

const prismaService = new PrismaService();
const scyllaService = new ScyllaService();
const redisService = new RedisService();

export const connectDB = async () => {
    try {
        await prismaService.connect();
        await scyllaService.connect();
        await redisService.connect();
    } catch (err: unknown) {
        process.exit(1);
    }
}

export { prismaService, scyllaService, redisService }