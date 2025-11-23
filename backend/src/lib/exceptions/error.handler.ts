import { AppError } from "./errors";
import { success, ZodError } from "zod";
import { ValidationError } from "./errors";
import { FastifyReply } from "fastify";
import chalk from "chalk";

export function handleError(res: FastifyReply, error: unknown) {
    console.error(`[${chalk.red("API Error")}]`, error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).send({
            success: false,
            status: error.statusCode,
            error: error.message,
            code: error.code,
            ...(error instanceof ValidationError && error.details
            ? { details: error.details }
            : {}),
        });
    }

    if (error instanceof ZodError) {
        return res.status(400).send({
            success: false,
            status: 400,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.issues,
        });
    }

    return res.status(500).send({
        error: 'Internal server error', code: 'INTERNAL_ERROR'
    });
}