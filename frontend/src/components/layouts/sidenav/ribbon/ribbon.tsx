"use client";

import { safe } from "@/lib/safe.utils";
import { CreateProjectButton } from "./createProject";
import Project from "./projects";
import { api } from "@/lib/axios.client";
import { handleError } from "@/lib/error.handler";
import { useEffect, useState } from "react";

export default function Ribbon() {
    const [projects, setProjects] = useState<any>([]);

    useEffect(() => {
        const loadProjects = async () => {
            const [data, error] = await safe(api.get("/api/v1/projects"));

            if (error) {
                handleError(error);
                return;
            }
            
            setProjects(data?.data.data || []);
        };

        loadProjects();
    }, []);

    return (
        <nav className="w-16 h-full p-2 flex flex-col items-center gap-2">
            {
                projects.map((project: any) => (
                    <Project key={project.id} project={project}/>
                ))
            }
            <hr className="w-full border border-foreground/10"/>
            <CreateProjectButton/>
        </nav>
    )
}