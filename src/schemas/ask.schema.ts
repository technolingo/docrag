import { z } from "zod";

export const askSchema = z.object({ question: z.string().min(10) });

export type AskInput = z.infer<typeof askSchema>;
