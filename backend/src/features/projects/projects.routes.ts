import { FastifyInstance } from "fastify";
import { authMiddleware, validateBody } from "../../middleware";
import { projectsController } from "./projects.controller";
import { createProjectSchema, CreateProjectType, updateProjectSchema, UpdateProjectType } from "./projects.validator";
import { messageSchema, MessageType } from "../chats/chats.validator";

export default function projectsRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/",
        { preValidation: authMiddleware },
        projectsController.getAllProjects,
    );

    fastify.post<{ Body: CreateProjectType }>(
        "/",
        { preValidation: [authMiddleware, validateBody(createProjectSchema)] },
        projectsController.createNewProject,
    );

    fastify.patch<{ Body: UpdateProjectType, Params: { id: string } }>(
        "/:id",
        { preValidation: [authMiddleware, validateBody(updateProjectSchema)]},
        projectsController.updateProject,
    );

    fastify.delete<{ Params: { id: string }}>(
        "/:id",
        { preValidation: authMiddleware },
        projectsController.deleteProject
    );

    fastify.get<{ Params: { id: string } }>(
        "/:id/chats",
        { preValidation: authMiddleware },
        projectsController.getProjectChats,
    )

    fastify.post<{ Body: MessageType, Params: { id: string }}>(
        "/:id/chats",
        { preValidation: [authMiddleware, validateBody(messageSchema)] },
        projectsController.createNewProjectChat,
    );
}