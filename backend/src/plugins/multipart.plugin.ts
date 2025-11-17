import multipart from "@fastify/multipart";
import { FastifyInstance } from "fastify";

export function registerMultipart(fastify: FastifyInstance) {
  fastify.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  });
}
