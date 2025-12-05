import { FastifyInstance } from "fastify";
import { localAuthController } from "../controllers/localAuth.controller";
import { loginSchema, LoginType, registerSchema, RegisterType } from "../auth.validators";

export default function localAuthRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: RegisterType }>(
        "/register",
        { config: { schema: registerSchema }},
        localAuthController.registerUser,
    );

    fastify.post<{ Body: LoginType }>(
        "/login",
        { config: { schema: loginSchema} },
        localAuthController.loginUser,
    );

    fastify.post(
        "/logout",
        localAuthController.logoutUser,
    );
}