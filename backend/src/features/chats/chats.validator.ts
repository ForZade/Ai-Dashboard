import { z } from "zod";

export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .trim(),
});

export type MessageType = z.infer<typeof messageSchema>;