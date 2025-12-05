import { FastifyInstance } from "fastify";
import { OtpSchema, OtpType } from "../auth.validators";
import { verificationController } from "../controllers/verification.controller";

export default function verifyAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: OtpType }>(
        "/verify",
        { config: { schema: OtpSchema }},
        verificationController.verifyAuthEmail,
    );

    fastify.post(
        "/verify/resend",
        verificationController.resendVerificationEmail,
    );
}