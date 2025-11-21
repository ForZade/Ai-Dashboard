import { FastifyInstance } from "fastify";
import { authMiddleware, validateBody } from "../../../middleware";
import { localAuthController } from "../controllers/localAuth.controller";
import { loginSchema, LoginType, registerSchema, RegisterType } from "../auth.validators";

export default function localAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: RegisterType }>(
        "/register",
        { preValidation: validateBody(registerSchema)},
        localAuthController.registerUser,
    );

    fastify.post<{ Body: LoginType }>(
        "/login",
        { preValidation: validateBody(loginSchema) },
        localAuthController.loginUser,
    );

    fastify.post(
        "/logout",
        { preValidation: authMiddleware },
        localAuthController.logoutUser,
    );
}