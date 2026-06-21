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
        const doc = await this.docs.createDocument(title, content);
        const chunks = this.chunker.chunk(doc.id, content);

        for (const chunk of chunks) {
            const embedding = await this.embedder.embed(chunk.text);
            await this.vectors.addOne({ ...chunk, embedding });
        }

        return { id: doc.id, title: doc.title, chunkCount: chunks.length };
    }
}
