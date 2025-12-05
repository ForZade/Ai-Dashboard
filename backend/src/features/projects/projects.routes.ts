import { FastifyInstance } from "fastify";
import { projectsController } from "./projects.controller";
import { createProjectSchema, CreateProjectType, updateProjectSchema, UpdateProjectType } from "./projects.validator";
import { messageSchema, MessageType } from "../chats/chat.validator";

export default function projectsRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/",
        projectsController.getAllProjects,
    );

    fastify.post<{ Body: CreateProjectType }>(
        "/",
        { config: { schema: createProjectSchema }},
        projectsController.createNewProject,
    );

    fastify.patch<{ Body: UpdateProjectType, Params: { id: string } }>(
        "/:id",
        { config: { schema: updateProjectSchema }},
        projectsController.updateProject,
    );

    fastify.delete<{ Params: { id: string }}>(
        "/:id",
        projectsController.deleteProject
    );

    fastify.get<{ Params: { id: string } }>(
        "/:id/chats",
        projectsController.getProjectChats,
    )

    fastify.post<{ Body: MessageType, Params: { id: string }}>(
        "/:id/chats",
        { config: { schema: messageSchema }},
        projectsController.createNewProjectChat,
    );
}