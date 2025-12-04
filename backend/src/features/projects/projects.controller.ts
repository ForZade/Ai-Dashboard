import { ProjectsService } from '../../services/projects.service';
import { safe } from '../../lib/utils/safe.utils';
import { handleError } from '../../lib/exceptions';
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from '../../db/postgres/prisma';
import { CreateProjectType, UpdateProjectType } from './projects.validator';
import { serializeToJson } from '../../lib/utils/serialize.utils';
import { chatService } from '../../services/chat.service';
import { messageService } from '../../services/message.service';

const projectsService = new ProjectsService();

export class ProjectsController {
    async getAllProjects(req: FastifyRequest, res: FastifyReply) {
        const user = req.user as User;

        const [projects, projectsError] = await safe(projectsService.getProjects(user.id));
        if (projectsError) return handleError(res, projectsError);

        return res.status(200).send({
            success: true,
            message: "Successfully gotten all projects",
            data: await serializeToJson(projects),
        });
    }

    async createNewProject(req: FastifyRequest<{ Body: CreateProjectType }>, res: FastifyReply) {
        const user = req.user as User;
        const body = req.body;

        const data = {
        ...body,
        user_id: user.id,
        };

        const [project, projectError] = await safe(projectsService.createProject(data));
        if (projectError) return handleError(res, projectError);

        return res.status(201).send({
            success: true,
            message: "New project created",
            data: await serializeToJson(project),
        });
    }

    async updateProject(
        req: FastifyRequest<{
            Body: UpdateProjectType,
            Params: { id: string }
        }>, 
        res: FastifyReply
    ) {
        const { id } = req.params;
        const user = req.user as User;
        const body = req.body;

        const projectId = BigInt(id);

        const [project, projectError] = await safe(
            projectsService.updateProject(projectId, user.id, body),
        );
        if (projectError) return handleError(res, projectError);

        return res.status(200).send({
            success: true,
            message: 'Project updated successfully',
            data: await serializeToJson(project),
        });
    }

    async deleteProject(req: FastifyRequest<{ Params: { id: string }}>, res: FastifyReply) {
        const { id } = req.params;
        const user = req.user as User;

        const projectId = BigInt(id);

        const [, deleteError] = await safe(projectsService.deleteProject(projectId, user.id));
        if (deleteError) return handleError(res, deleteError);

        return res.status(200).send({
            success: true,
            message: 'Project successfully deleted.',
        });
    }

    async getProjectChats(req: FastifyRequest<{ Params: { id: string }}>, res: FastifyReply) {
        const { id } = req.params;
        const projectId = BigInt(id);

        const [chats, chatsError] = await safe(chatService.getAllChats(projectId));
        if (chatsError) return handleError(res, chatsError);

        return res.status(200).send({
            success: true,
            data: await serializeToJson(chats),
        });
    }

    async createNewProjectChat(req: FastifyRequest<{ Body: { message: string }, Params: { id: string }}>, res: FastifyReply) {
        const user = req.user as User;
        const { id } = req.params
        const { message } = req.body;
        const projectId = BigInt(id);
        
        const [chat, chatError] = await safe(chatService.createNewChat(message, user.id, projectId));
        if (chatError) return handleError(res, chatError);

        const [, msgError] = await safe(messageService.sendMessage(message, user.id, chat.id));
        if (msgError) return handleError(res, msgError);

        return res
            .status(201)
            .send({
                success: true,
                message: "Successfully created new Chat",
                data: await serializeToJson(chat),
                redirect: `/chat/${chat.id.toString()}`,
            });
    }
}

export const projectsController = new ProjectsController();
