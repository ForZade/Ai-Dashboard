import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authMiddleware } from "../../middleware";
import { registerOnRequest } from "./onRequest.hook";

export function registerHooks(fastify: FastifyInstance) {
    registerOnRequest(fastify);
}
