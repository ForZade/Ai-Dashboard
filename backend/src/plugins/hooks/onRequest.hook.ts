import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authMiddleware } from "../../middleware";

export function registerOnRequest(fastify: FastifyInstance) {
    fastify.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply) => {
        if (req.raw.url?.startsWith("/api/v1/auth")) return;

        await authMiddleware(req, res);
    });
}
