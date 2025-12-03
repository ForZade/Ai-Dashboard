"use client";

import { CreateProjectValues } from "@/components/layouts/modal/createProject.form";
import { api } from "@/lib/axios.client";
import { handleError } from "@/lib/error.handler";
import { safe } from "@/lib/safe.utils";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UseFormSetError } from "react-hook-form";

interface ProjectsContextType {
  projects: Project[],
  selected: string,
  categories: any;
  loadProjects: (projects: any) => void;
  createProject: (projects: CreateProjectValues, setError: UseFormSetError<CreateProjectValues>) => void;
  deleteProject: (projectId: string) => void;
  selectProject: (projectId: string) => void;
}

interface Project {
    id: string,
    name: string,
    icon: string,
    color: string,
    position: number,
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjects must be used within ProjectsProvider");
  return context;
};

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [categories, setCategories] = useState(null);

    useEffect(() => {
        console.log(selected, categories);
    }, [selected, categories])

    const loadProjects = (projects: any) => {
        setProjects(projects);

        setSelected(projects[0].id);
        return;
    }

    const createProject = async (data: CreateProjectValues, setError: UseFormSetError<CreateProjectValues>) => {
        const [res, projectError] = await safe(api.post('/api/v1/projects', data));
        if (projectError) return handleError(projectError, setError);

        const project = res.data.data;

        setProjects(prev => [...prev, project]);
        return;
    }

    const deleteProject = async (projectId: string) => {
        const [, projectError] = await safe(api.delete(`/api/v1/projects/${projectId}`));
        if (projectError) return handleError(projectError);

        setProjects(prev => prev.filter(p => p.id !== projectId));
        return;
    }

    const selectProject = async (projectId: string) => {
        setSelected(projectId);

        const [res, categoryError] = await safe(api.get(`/api/v1/projects/${projectId}`));
        if (categoryError) return handleError(categoryError);

        const result = res.data.data;

        setCategories(result);
        return;
    }

  return (
    <ProjectsContext.Provider value={{ projects, selected, categories, loadProjects, createProject, deleteProject, selectProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};
