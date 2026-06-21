// Dependency Injection: the only file allowed to use `new`.

import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { makeDocumentsController } from "./controllers/documents.controller.ts";
import { InMemoryDocumentRepository } from "./repositories/document.repository.ts";
import { InMemoryVectorRepository } from "./repositories/vector.repository.ts";
import { makeDocumentsRouter } from "./routes/documents.routes.ts";
import { SlidingWindowChunker } from "./services/chunker.ts";
import { OllamaEmbedder } from "./services/embedder.ts";
import { IngestService } from "./services/ingest.service.ts";

export function buildApp() {
    // adapters: swappable concretes
    const documentRepository = new InMemoryDocumentRepository();
    const vectorRepository = new InMemoryVectorRepository();
    const chunker = new SlidingWindowChunker();
    const embedder = new OllamaEmbedder();
    // const chunker = new SlidingWindowChunker(config.chunk.size, config.chunk.overlap);
    // const embedder = new OllamaEmbedder(config.ollama.baseUrl, config.ollama.model);

    // application service: wired from the abstractions above
    const ingestService = new IngestService(
        documentRepository,
        vectorRepository,
        chunker,
        embedder,
    );

    // web layer: closures over the service
    const documentsController = makeDocumentsController(ingestService);
    const documentsRouter = makeDocumentsRouter(documentsController);

    return createApp({ documentsRouter });
}
