import { FastifyInstance } from "fastify";
import { OtpSchema, OtpType } from "../auth.validators";
import { authMiddleware, validateBody } from "../../../middleware";
import { verificationController } from "../controllers/verification.controller";

export default function verifyAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: OtpType }>(
        "/verify",
        { preValidation: [authMiddleware, validateBody(OtpSchema)]},
        verificationController.verifyAuthEmail,
    );

    fastify.post(
        "/verify/resend",
        { 
            preValidation: authMiddleware,
        },
        verificationController.resendVerificationEmail,
    );
}