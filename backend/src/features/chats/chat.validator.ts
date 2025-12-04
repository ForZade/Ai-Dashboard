import { z } from "zod";

export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .trim(),
});

export const updateNameSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(128, "Name can not be longer than 128 characters")
});

export type MessageType = z.infer<typeof messageSchema>;
export type UpdateNameType = z.infer<typeof updateNameSchema>;