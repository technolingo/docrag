import type { DocumentRepository } from "../repositories/document.repository.ts";
import type { VectorRepository } from "../repositories/vector.repository.ts";
import type { Chunker } from "./chunker.ts";
import type { Embedder } from "./embedder.ts";
// import & depend only on interfaces

export class IngestService {
    private readonly docs: DocumentRepository;
    private readonly vectors: VectorRepository;
    private readonly chunker: Chunker;
    private readonly embedder: Embedder;
    constructor(
        docs: DocumentRepository,
        vectors: VectorRepository,
        chunker: Chunker,
        embedder: Embedder,
    ) {
        this.docs = docs;
        this.vectors = vectors;
        this.chunker = chunker;
        this.embedder = embedder;
    }

    async ingest(title: string, content: string) {
        // TODO: chunk → embed → store
        return { id: 1, title, content, chunkCount: 0 };
    }
}
