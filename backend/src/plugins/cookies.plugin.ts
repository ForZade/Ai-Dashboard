import fastifyCookie from "@fastify/cookie";
import { FastifyInstance } from "fastify";

export function registerCookies(fastify: FastifyInstance) {
  fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "",
  });
}
