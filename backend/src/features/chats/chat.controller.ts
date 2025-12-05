import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../../db/postgres/prisma";
import { safe } from "../../lib/utils/safe.utils";
import { chatService } from "../../services/chat.service";
import { handleError } from "../../lib/exceptions";
import { serializeToJson } from "../../lib/utils/serialize.utils";
import { messageService } from "../../services/message.service";

export class ChatController {
    async updateChatName(req: FastifyRequest<{ Body: { name: string }, Params: { id: string }}>, res: FastifyReply) {
        const user = req.user as User;
        const { id } = req.params;
        const { name } = req.body;

        const chatId = BigInt(id);

        const [chat, chatError] = await safe(chatService.updateChatName(name, user.id, chatId));
        if (chatError) return handleError(res, chatError);

        return res
            .status(200)
            .send({
                success: true,
                message: "Successfully updated chat name",
                data: await serializeToJson(chat),
            });
    }

    async deleteChat(req: FastifyRequest<{ Params: { id: string }}>, res: FastifyReply) {
        const user = req.user as User;
        const { id } = req.params;
        const chatId = BigInt(id);

        const [chat, chatError] = await safe(chatService.deleteChat(user.id, chatId));
        if (chatError) return handleError(res, chatError);

        return res.status(200).send({
            success: true,
            message: "Chat was successfully deleted",
            data: await serializeToJson(chat),
        });
    }

    async pinChat(req: FastifyRequest<{ Params: { id: string }}>, res: FastifyReply) {
        const user = req.user as User;
        const { id } = req.params;
        const chatId = BigInt(id);

        const [chat, chatError] = await safe(chatService.pinChat(user.id, chatId));
        if (chatError) return handleError(res, chatError);

        return res.status(200).send({
            success: true,
            message: "Chat pin status was successfully changed",
            data: await serializeToJson(chat),
        });
    }

    async sendChannelMessage(req: FastifyRequest<{ Body: { message: string }, Params: { id: string }}>, res: FastifyReply) {
        const user = req.user as User;
        const { id } = req.params;
        const { message } = req.body;
        const chatId = BigInt(id);

        const [msg, msgError] = await safe(messageService.sendMessage(message, user.id, chatId));
        if (msgError) return handleError(res, msgError);

        return res.status(200).send({
            success: true,
            message: "Message sent successfully",
            data: msg,
        });
    }

    async getChannelMessages(req: FastifyRequest<{ 
        Params: { id: string }, 
        Querystring: { direction?: string, fromMessageId?: string, limit?: string }
    }>, res: FastifyReply) {
        const { id } = req.params;
        const { direction, fromMessageId, limit = "50" } = req.query;

        const [messages, messagesError] = await safe(chatService.getMessages(id, limit, direction, fromMessageId));
        if (messagesError) return handleError(res, messagesError);

        return res.status(200).send({
            success: true,
            data: messages,
            count: messages.length,
        });
    }
}

export const chatController = new ChatController();