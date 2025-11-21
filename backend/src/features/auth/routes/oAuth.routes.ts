import { FastifyInstance } from "fastify";
import { oAuthController } from "../controllers/oAuth.controller";
import googlePassport from "../google.strategy";


export default function oauthRoutes(fastify: FastifyInstance) {
    fastify.get("/google", { preHandler: googlePassport.authenticate("google", {
                scope: ["profile", "email"],
            }),
        },
        () => {},
    );

    fastify.get(
        "/google/callback", 
        {
            preValidation: googlePassport.authenticate("google", {
                session: false,
            }),
        },
        oAuthController.oauthCallback,
    );
}