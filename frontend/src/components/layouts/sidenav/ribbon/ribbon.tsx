'use client';

import { safe } from '@/lib/safe.utils';
import { CreateProjectButton } from './createProject';
import { api } from '@/lib/axios.client';
import { handleError } from '@/lib/error.handler';
import { useEffect } from 'react';
import ProjectInteractive from './project/project.interactive';
import { useProjects } from '@/contexts/useProjects';

export default function Ribbon() {
  const { loadProjects, projects } = useProjects();

    useEffect(() => {
        const fetchProjects = async () => {
            const [data, error] = await safe(api.get('/api/v1/projects'));

            if (error) {
                handleError(error);
                return;
            }

            loadProjects(data?.data.data || []);
        };

        fetchProjects();
    }, []);

    return (
        <nav className="w-16 h-full p-4 flex flex-col items-center gap-2">
            {projects.map((project: any) => (
                <ProjectInteractive key={project.id} project={project} />
            ))}
            <hr className="w-full border border-foreground/10" />
            <CreateProjectButton />
        </nav>
    );
}
