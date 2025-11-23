import { FieldValues, Path, UseFormSetError } from "react-hook-form";

interface ValidationDetail {
    code: string;
    path: string[];
    message: string;
}

interface BackendValidationError {
    success: boolean,
    status: number,
    error: string;
    code: string;
    details?: ValidationDetail[];
}

export function handleError<T extends FieldValues>(
    fetchError: { message: string; error?: unknown },
    setError: UseFormSetError<T>
) {
    const backendError = fetchError.error as BackendValidationError;

    if (!backendError.success && backendError.status === 401) {
        return window.location.replace("/login");
    }

    if (fetchError.error && typeof fetchError.error === 'object') {
        if (backendError.details && Array.isArray(backendError.details)) {
            backendError.details.forEach((detail) => {
                const fieldName = detail.path[0] as Path<T>;
                if (fieldName) {
                    setError(fieldName, {
                        type: "manual",
                        message: detail.message,
                    });
                }
            });
            return;
        }
    }
    
    // Handle other errors
}