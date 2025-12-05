import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware";

export function registerPreValidation(fastify: FastifyInstance) {
    fastify.addHook("preValidation", async (req: FastifyRequest, res: FastifyReply) => {
        if (req.raw.url?.startsWith("/api/v1/auth")) return;

        await IdempotencyMiddleware(req, res);
    });
}