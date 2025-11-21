import { FastifyInstance } from "fastify";
import { authMiddleware, validateBody } from "../../../middleware";
import { passwordController } from "../controllers/password.controller";
import { EmailType, ResetPasswordSchema, ChangePasswordType, EmailSchema, ResetPasswordType, ChangePasswordSchema, ValidateOtpType, ValidateOtpSchema } from "../auth.validators";

export default function passwordAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: EmailType }>(
        "/password/request",
        { preValidation: validateBody(EmailSchema)},
        passwordController.requestPasswordReset,
    );

    fastify.post<{ Body: ValidateOtpType}>(
        "/password/verify-otp",
        { preValidation: validateBody(ValidateOtpSchema)},
        passwordController.validatePasswordReset,
    );

    fastify.post<{ Body: ResetPasswordType }>(
        "/password/reset",
        { preValidation: validateBody(ResetPasswordSchema)},
        passwordController.resetPassword,
    );

    fastify.post<{ Body: ChangePasswordType }>(
        "/password",
        { preValidation: [authMiddleware, validateBody(ChangePasswordSchema)]},
        passwordController.changePassword,
    );
}