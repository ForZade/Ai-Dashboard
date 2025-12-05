import { FastifyInstance } from "fastify";
import { messageSchema, updateNameSchema, UpdateNameType } from "../chats/chat.validator";
import { chatController } from "./chat.controller";

export default function chatsRoutes(fastify: FastifyInstance) {
    fastify.patch<{ Body: UpdateNameType, Params: { id: string }}>(
        "/:id",
        { config: { schema: updateNameSchema }},
        chatController.updateChatName,
    );

    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        chatController.deleteChat,
    );

    fastify.post<{ Params: { id: string }}>(
        "/:id/pin",
        chatController.pinChat,
    );

    fastify.post<{ Body: { message: string }, Params: {id: string }}>(
        "/:id/messages",
        { config: { schema: messageSchema }},
        chatController.sendChannelMessage,
    );

    fastify.get<{ Params: { id: string}, Querystring: { direction: string, fromMessageId: string, limit: string }}>(
        "/:id/messages",
        chatController.getChannelMessages,
    );
}