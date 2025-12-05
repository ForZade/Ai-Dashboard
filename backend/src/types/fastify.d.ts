import { ZodAny, ZodObject } from "zod";

declare module "fastify" {
  interface FastifyContextConfig {
    schema: ZodObject<any>;
  }
}
