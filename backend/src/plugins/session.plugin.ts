import fastifySecureSession from "@fastify/secure-session";
import { FastifyInstance } from "fastify";

export function registerSession(fastify: FastifyInstance) {
  fastify.register(fastifySecureSession, {
    key: Buffer.from(process.env.SESSION_SECRET || ""),
    cookie: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 15,
    },
  });
}
