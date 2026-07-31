export interface Embedder {
    embed(text: string): Promise<number[]>;
}

export class OllamaEmbedder implements Embedder {
    private readonly baseUrl: string;
    private readonly model: string;
    constructor(baseUrl: string, model: string) {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async embed(text: string): Promise<number[]> {
        let res: Response;
        try {
            res = await fetch(`${this.baseUrl}/api/embed`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ model: this.model, input: text }),
            });
        } catch (err) {
            throw new Error(`Cannot reach Ollama at ${this.baseUrl}`, { cause: err });
        }
        if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`);

        const data = (await res.json()) as { embeddings: number[][] };
        const vector = data.embeddings[0]; // number[] | undefined under noUncheckedIndexedAccess
        if (!vector) throw new Error("Ollama returned no embedding");
        return vector;
    }
}
