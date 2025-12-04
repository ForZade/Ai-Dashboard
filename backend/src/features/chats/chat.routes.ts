import { FastifyInstance } from "fastify";
import { authMiddleware, validateBody } from "../../middleware";
import { updateNameSchema, UpdateNameType } from "../chats/chat.validator";
import { chatsController } from "./chat.controller";

export default function projectsRoutes(fastify: FastifyInstance) {
    fastify.patch<{ Body: UpdateNameType, Params: { id: string }}>(
        "/:id",
        { preValidation: [authMiddleware, validateBody(updateNameSchema)] },
        chatsController.updateChatName,
    );

    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        { preValidation: authMiddleware },
        chatsController.deleteChat,
    );
}