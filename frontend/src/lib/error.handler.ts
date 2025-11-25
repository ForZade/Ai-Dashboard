import { UseFormSetError, FieldValues, Path } from "react-hook-form";

export interface ValidationDetail {
  path: string;
  message: string;
}

export interface BackendError {
  code?: string;
  message?: string;
  error?: string;
  details?: ValidationDetail[];
  status?: number;
}

export function handleError<T extends FieldValues>(
  error: BackendError,
  setError?: UseFormSetError<T>
): void {

    console.log(error);

    if (error.code === "VALIDATION_ERROR" && Array.isArray(error.details) && setError) {
        error.details.forEach(({ path, message }) => {
        const fieldPath = path as Path<T>;
        setError(fieldPath, { type: "manual", message });
        });
        return;
    }

    if (error.code === "INVALID_CREDENTIALS" && setError) {
        console.log(error)
        setError("root" as Path<T>, { type: "manual", message: error.error});
        return;
    }

    const msg = error.message ?? "Something went wrong";
    alert(msg);
}
