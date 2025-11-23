"use client";

import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { SignupInput, signupSchema } from "../auth.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { safe } from "@/lib/safe.utils";
import api from "@/lib/axios.client";
import { useAuth } from "@/contexts/auth.context";
import { handleError } from "@/lib/error.handler";

export default function RegisterPage() {
    const { register, handleSubmit, setError, formState: { errors, isSubmitting }} = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
    });
    const { token } = useAuth();
    const router = useRouter();

    const onSubmit = async (data: SignupInput) => {
        const parsed = signupSchema.safeParse(data);
        if (!parsed.success) return handleError(parsed.error, setError);

        const [_, fetchError] = await safe(api.post("/api/v1/auth/register", parsed.data, {
            headers: { Authorization: `Bearer ${token}` }
        }));
        if (fetchError) return handleError(fetchError, setError);

        router.push("/dashboard");
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-bold text-nowrap text-white text-center">Register</h1>

            <form className="flex-col flex gap-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="w-min h-min flex flex-col gap-2">
                    <label className="text-foreground/50 font-bold text-sm">
                        Email
                    </label>

                    <Input
                        placeholder="Email" 
                        className="min-w-60 max-w-80 w-80"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-red-400 text-xs">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="w-min h-min flex flex-col gap-2">
                    <label className="text-foreground/50 font-bold text-sm">
                        Password
                    </label>

                    <Input
                        placeholder="Password"
                        className="min-w-60 max-w-80 w-80"
                        type="password"
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-red-400 text-xs">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="w-min h-min flex flex-col gap-2">
                    <label className="text-foreground/50 font-bold text-sm">
                        Confirm Password
                    </label>

                    <Input
                        placeholder="Confirm Password"
                        className="min-w-60 max-w-80 w-80"
                        type="password"
                        {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-400 text-xs">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                <div className="w-full h-min text-foreground text-sm flex gap-1 items-center justify-center">
                    Already have an account?
                    <a className="text-accent-blue-300 underline font-semibold">Log in</a>
                    !
                </div>

                {errors.root && <p style={{ color: "red" }}>{errors.root.message}</p>}

                <button className="w-full py-2 text-foreground bg-accent-blue-100 rounded-lg" type="submit">
                    {isSubmitting ? "Loading..." : "Sign Up"}
                </button>
            </form>
        </div>
    )
}