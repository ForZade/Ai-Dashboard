import authRoutes from "../features/auth/routes";
import { handleError } from "../lib/exceptions/error.handler";
import { FastifyInstance } from "fastify";

export function registerRoutes(fastify: FastifyInstance) {
    fastify.register(authRoutes, { prefix: "/auth"});
}
