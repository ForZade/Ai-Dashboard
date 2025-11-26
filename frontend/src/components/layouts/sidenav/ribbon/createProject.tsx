"use client";

import { api } from "@/lib/axios.client";
import { handleError } from "@/lib/error.handler";
import { safe } from "@/lib/safe.utils";
import { Plus } from "lucide-react"

export function CreateProjectButton() {
    const tempData = {
        name: "Temp",
    }

    const onSubmit = async () => {
        const [, error] = await safe(api.post("/api/v1/projects", tempData))
        if (error) return handleError(error);
    }

    return (
        <button className="p-2 rounded-full bg-c-gray/20 hover:bg-c-gray/30 transition-colors cursor-pointer">
            <Plus className="size-6 text-c-gray" strokeWidth={2}/>
        </button>
    )
}