"use client";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { OtpInput, OtpSchema } from "../auth.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleError } from "@/lib/error.handler";
import { safe } from "@/lib/safe.utils";
import { api } from "@/lib/axios.client";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUser.store";

export default function VerifyPage() {
    const { control, handleSubmit, setError, formState: { errors, isSubmitting }} = useForm<OtpInput>({
        resolver: zodResolver(OtpSchema),
    });
    const router = useRouter()
    const { setUser } = useUserStore();

    const onSubmit = async (data: OtpInput) => {
        const [res, resError] = await safe(api.post("/api/v1/auth/verify", data));
        if (resError) return handleError(resError, setError);

        const user = res.data;
        setUser(user);

        if (!user.username) return router.replace("/setup");

        router.replace("/chat");
    };

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-xl font-bold text-nowrap text-foreground text-center">Verify</h1>
                <p className="text-sm text-foreground/75 text-center">Verification code was sent to your email address.</p>
            </header>

            <div className="w-min h-min flex flex-col gap-2">
                <label className="text-foreground/50 font-bold text-sm">
                    Code
                </label>

                <Controller
                    name="otp"
                    control={control}
                    render={({ field }) => (
                        <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                        >
                            <InputOTPGroup><InputOTPSlot index={0} /></InputOTPGroup>
                            <InputOTPGroup><InputOTPSlot index={1} /></InputOTPGroup>
                            <InputOTPGroup><InputOTPSlot index={2} /></InputOTPGroup>
                            <InputOTPGroup><InputOTPSlot index={3} /></InputOTPGroup>
                            <InputOTPGroup><InputOTPSlot index={4} /></InputOTPGroup>
                            <InputOTPGroup><InputOTPSlot index={5} /></InputOTPGroup>
                        </InputOTP>
                    )}
                />
                
                {errors.otp && (
                    <p className="text-red-400 text-xs">
                        {errors.otp.message}
                    </p>
                )}
            </div>

            <div className="w-full h-min text-foreground text-sm flex gap-1 items-center justify-center">
                <a className="text-accent-blue-300 underline font-semibold">Resend verification code</a>
            </div>

            <button className="w-full py-2 text-foreground bg-accent-blue-100 rounded-lg" type="submit" onClick={handleSubmit(onSubmit)}>
                {isSubmitting ? "Loading..." : "Verify"}
            </button>
        </div>
    )
}