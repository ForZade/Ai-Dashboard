import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IdempotencyMiddleware } from "../../middleware/idempotency.middleware";
import { validateBody } from "../../middleware";

export function registerPreValidation(fastify: FastifyInstance) {
    fastify.addHook("preValidation", async (req: FastifyRequest, res: FastifyReply) => {
        const schema = req.routeOptions.config.schema;

        if (schema) {
            await validateBody(schema)(req, res);
        }

        if (req.raw.url?.startsWith("/api/v1/auth")) return;

        await IdempotencyMiddleware(req, res);
    });
}