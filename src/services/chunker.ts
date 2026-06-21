import type { Chunk } from "../domain/types.ts";

export type Chunker = {
    chunk(docId: number, text: string): Chunk[];
};

export class SlidingWindowChunker implements Chunker {
    // dependency injection (instead of importing config)
    private readonly size: number;
    private readonly overlap: number;
    constructor(size: number, overlap: number) {
        if (overlap >= size)
            throw new Error("overlap must be smaller than size");
        this.size = size;
        this.overlap = overlap;
    }

    chunk(docId: number, text: string): Chunk[] {
        const chunks: Chunk[] = [];
        const step = this.size - this.overlap;
        let index = 0;
        for (let start = 0; start < text.length; start += step) {
            const slice = text.slice(start, start + this.size).trim();
            if (slice) chunks.push({ docId, index: index++, text: slice });
        }
        return chunks;
    }
}
