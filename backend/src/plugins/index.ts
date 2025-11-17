import Fastify from "fastify";
import { registerCors } from "./cors.plugin";
import { registerCookies } from "./cookies.plugin";
import { registerSession } from "./session.plugin";
import { registerMultipart } from "./multipart.plugin";

export function createServer() {
  const app = Fastify();

  registerCors(app);
  registerCookies(app);
  registerSession(app);
  registerMultipart(app);

  return app;
}
