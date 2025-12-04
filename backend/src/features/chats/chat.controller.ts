import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../../db/postgres/prisma";
import { safe } from "../../lib/utils/safe.utils";
import { chatService } from "../../services/chat.service";
import { handleError } from "../../lib/exceptions";
import { success } from "zod";

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
                data: chat,
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
            data: chat,
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
            data: chat,
        });
    }
}

export const chatController = new ChatController();