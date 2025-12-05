import Fastify from "fastify";
import { registerCors } from "./cors.plugin";
import { registerCookies } from "./cookies.plugin";
import { registerSession } from "./session.plugin";
import { registerMultipart } from "./multipart.plugin";
import { registerErrorHandling } from "./errors.plugin";
import { registerRoutes } from "./routes.plugin";
import { connectDB } from "../db";
import { registerPassport } from "./passport.plugin";
import { registerHooks } from "./hooks";

export function createServer() {
  const app = Fastify();

  connectDB();

  registerCors(app);
  registerCookies(app);
  registerSession(app);
  registerMultipart(app);
  registerErrorHandling(app);
  registerPassport(app);
  registerHooks(app);
  app.register(registerRoutes, { prefix: "/api/v1" });

  return app;
}
