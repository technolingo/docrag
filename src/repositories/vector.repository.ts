import type { EmbeddedChunk } from "../domain/types.ts";

export type VectorRepository = {
    addOne(chunk: EmbeddedChunk): Promise<void>;
    getAll(): Promise<EmbeddedChunk[]>;
    deleteByDocId(docId: number): Promise<void>;
};

export class InMemoryVectorRepository implements VectorRepository {
    private chunks: EmbeddedChunk[] = [];

    async addOne(chunk: EmbeddedChunk): Promise<void> {
        this.chunks.push(chunk);
    }

    async getAll(): Promise<EmbeddedChunk[]> {
        return this.chunks;
    }

    async deleteByDocId(docId: number): Promise<void> {
        this.chunks = this.chunks.filter((c) => c.docId !== docId);
    }
}
