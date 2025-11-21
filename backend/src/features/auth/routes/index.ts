import { FastifyInstance } from "fastify";
import oauthRoutes from "./oAuth.routes";
import localAuthRoutes from "./localAuth.routes";
import verifyAuthRoutes from "./verification.routes";
import passwordAuthRoutes from "./password.routes";

export default function authRoutes(fastify: FastifyInstance) {
  fastify.register(oauthRoutes);
  fastify.register(localAuthRoutes);
  fastify.register(verifyAuthRoutes);
  fastify.register(passwordAuthRoutes);
}
