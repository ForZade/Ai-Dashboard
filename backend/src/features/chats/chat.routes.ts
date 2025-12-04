import { FastifyInstance } from "fastify";
import { authMiddleware, validateBody } from "../../middleware";
import { updateNameSchema, UpdateNameType } from "../chats/chat.validator";
import { chatController } from "./chat.controller";

export default function projectsRoutes(fastify: FastifyInstance) {
    fastify.patch<{ Body: UpdateNameType, Params: { id: string }}>(
        "/:id",
        { preValidation: [authMiddleware, validateBody(updateNameSchema)] },
        chatController.updateChatName,
    );

    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        { preValidation: authMiddleware },
        chatController.deleteChat,
    );

    fastify.post<{ Params: { id: string }}>(
        "/:id/pin",
        { preValidation: authMiddleware },
        chatController.pinChat,
    );
}