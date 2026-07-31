import { z } from "zod";

export const createDocumentSchema = z.object({
    title: z.string().min(10),
    content: z.string().min(100),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
