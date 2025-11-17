import fastifyCors from "@fastify/cors";
import { FastifyInstance } from "fastify";

export function registerCors(fastify: FastifyInstance) {
  fastify.register(fastifyCors, {
    origin: [process.env.FRONTEND_URL ?? "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });
}
