"use client";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Project from "./project";
import { useProjects } from "@/contexts/useProjects";

export default function ProjectInteractive({ project, size }: { project: any, size?: "defalut" | "sm" | "lg" }) {
    const { deleteProject, selectProject } = useProjects();

    return (
        <Tooltip>
            <ContextMenu>
                <ContextMenuTrigger>
                    <TooltipTrigger className="rounded-full">
                        <Project project={project} size={size} onClick={() => selectProject(project.id)}/>
                    </TooltipTrigger>
                </ContextMenuTrigger>

                <ContextMenuContent>
                    <ContextMenuItem>
                        Edit
                    </ContextMenuItem>

                    <ContextMenuItem variant="destructive" onClick={() => deleteProject(project.id)}>
                        Delete project
                    </ContextMenuItem>
                </ContextMenuContent>

            </ContextMenu>

            <TooltipContent side="right" className="text-sm font-bold">
                {project.name}
            </TooltipContent>
        </Tooltip>
    )
}