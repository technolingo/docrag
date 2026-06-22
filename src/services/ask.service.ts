import type { Answer } from "../domain/types.ts";
import type { VectorRepository } from "../repositories/vector.repository.ts";
import type { Embedder } from "./embedder.ts";
import type { Generator } from "./generator.ts";
import type { Retriever } from "./retriever.ts";

export class AskService {
    private readonly vectors: VectorRepository;
    private readonly embedder: Embedder;
    private readonly retriever: Retriever;
    private readonly generator: Generator;
    constructor(
        vectors: VectorRepository,
        embedder: Embedder,
        retriever: Retriever,
        generator: Generator,
    ) {
        this.vectors = vectors;
        this.embedder = embedder;
        this.retriever = retriever;
        this.generator = generator;
    }

    async answer(question: string): Promise<Answer> {
        const queryEmbedding = await this.embedder.embed(question);
        const storedChunks = await this.vectors.getAll();
        const ctxChunks = this.retriever.retrieve(queryEmbedding, storedChunks);
        const text = await this.generator.generate(question, ctxChunks);
        const citations = ctxChunks.map((c) => ({
            docId: c.docId,
            index: c.index,
        }));
        return { text, citations };
    }
}
