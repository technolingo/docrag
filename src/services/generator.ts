import type { Chunk } from "../domain/types.ts";

export interface Generator {
    generate(query: string, context: Chunk[]): Promise<string>;
}

const SYSTEM_PROMPT =
    "You are a precise assistant. Answer the question using ONLY the provided context. " +
    "If the context does not contain the answer, say you don't know. " +
    "Do not rely on outside knowledge. Be concise.";

export class OllamaGenerator implements Generator {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly temperature: number;
    constructor(baseUrl: string, model: string, temperature: number) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.temperature = temperature;
    }

    async generate(query: string, context: Chunk[]): Promise<string> {
        if (context.length === 0) {
            return "No relevant context was found in the documents.";
        }

        const contextBlock = context
            .map((c, i) => `[Source ${i + 1}]\n${c.text}`)
            .join("\n\n");
        const userPrompt = `Context:\n${contextBlock}\n\nQuestion: ${query}`;

        const res = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
                stream: false, // one JSON object back, not a token stream
                options: { temperature: this.temperature },
            }),
        });
        if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`);

        const data = (await res.json()) as { message?: { content?: string } };
        const content = data.message?.content;
        if (!content) throw new Error("Ollama returned no content");
        return content.trim();
    }
}
