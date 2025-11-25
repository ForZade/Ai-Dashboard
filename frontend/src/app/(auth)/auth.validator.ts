import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signupSchema = z.object({
  email: z
      .string()
      .min(1, { message: "Email is required" })
      .regex(emailRegex, { message: "Invalid email address" }),
  password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
      .regex(/[0-9]/, { message: "Password must contain a number" })
      .regex(/[!@#$%^&*.,]/, { message: "Password must contain a special character" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .regex(emailRegex, { message: "Invalid email address" }),
    password: z
        .string()
        .min(1, "Password is required"),
});

export const OtpSchema = z.object({
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof OtpSchema>;