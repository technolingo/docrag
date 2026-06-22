import type { EmbeddedChunk } from "../domain/types.ts";
import { cosineSimilarity } from "../lib/cosine.ts";

export interface Retriever {
    retrieve(
        queryEmbedding: number[],
        chunks: EmbeddedChunk[],
    ): EmbeddedChunk[];
}

export class CosineRetriever implements Retriever {
    private readonly topK: number;
    constructor(topK: number) {
        this.topK = topK;
    }

    retrieve(
        queryEmbedding: number[],
        chunks: EmbeddedChunk[],
    ): EmbeddedChunk[] {
        return chunks
            .map((chunk) => ({
                chunk,
                score: cosineSimilarity(queryEmbedding, chunk.embedding),
            }))
            .sort((a, b) => b.score - a.score) // desc (flip order if positive diff)
            .slice(0, this.topK)
            .map((scored) => scored.chunk);
    }
}
