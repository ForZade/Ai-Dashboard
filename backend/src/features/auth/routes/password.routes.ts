import { FastifyInstance } from "fastify";
import { passwordController } from "../controllers/password.controller";
import { EmailType, ResetPasswordSchema, ChangePasswordType, EmailSchema, ResetPasswordType, ChangePasswordSchema, ValidateOtpType, ValidateOtpSchema } from "../auth.validators";

export default function passwordAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: EmailType }>(
        "/password/request",
        { config: { schema: EmailSchema }},
        passwordController.requestPasswordReset,
    );

    fastify.post<{ Body: ValidateOtpType}>(
        "/password/verify-otp",
        { config: { schema: ValidateOtpSchema }},
        passwordController.validatePasswordReset,
    );

    fastify.post<{ Body: ResetPasswordType }>(
        "/password/reset",
        { config: { schema: ResetPasswordSchema}},
        passwordController.resetPassword,
    );

    fastify.post<{ Body: ChangePasswordType }>(
        "/password",
        { config: { schema: ChangePasswordSchema }},
        passwordController.changePassword,
    );
}