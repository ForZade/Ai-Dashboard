import fastifyPassport from "../features/auth/google.strategy";
import { FastifyInstance } from "fastify";

export function registerPassport(fastify: FastifyInstance) {
  fastify.register(fastifyPassport.initialize());
}
