import { FastifyReply, FastifyRequest } from "fastify"
import { handleError } from "../lib/exceptions";
import { ZodType } from "zod";

export const validateBody = <T>(schema: ZodType<T>) => {
    return async (req: FastifyRequest, res: FastifyReply) => {
        const result = await schema.safeParseAsync(req.body);
        if (!result.success) return handleError(res, result.error);

        req.body = result.data;
    }
}